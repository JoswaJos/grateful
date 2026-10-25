// Supabase Edge Function (runs on Deno, on Supabase's servers — not in the app).
// 1. Uses the caller's Clerk token, so RLS only lets it read/write THEIR rows.
// 2. Sends the last 7 days of entries to Gemini with a strict JSON schema.
// 3. Saves the result in `insights` and returns it.
// The Gemini key lives only here, as a secret — never inside the app.
import { createClient } from "npm:@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// Date helpers in IST
const istToday = () => new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
const addDays = (d: string, n: number) => {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day + n)).toISOString().slice(0, 10);
};
const mondayOf = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, day)).getUTCDay(); // 0 = Sunday
  return addDays(d, dow === 0 ? -6 : 1 - dow);
};

// Reads the user id ("sub") from the token. RLS still re-checks it in the database,
// so a fake token can't read or write anyone else's data.
const subFromToken = (token: string): string | null => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.sub ?? null;
  } catch {
    return null;
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const userId = subFromToken(token);
  if (!userId) return json({ error: "Not signed in" }, 401);

  // Client that acts AS the user → RLS applies.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const today = istToday();
  const { data: entries, error } = await supabase
    .from("entries")
    .select("entry_date, item_1, item_2, item_3, mood")
    .gte("entry_date", addDays(today, -6))
    .order("entry_date");
  if (error) return json({ error: error.message }, 401);
  if (!entries || entries.length < 2) {
    return json({ error: "Write at least 2 entries this week to get insights." }, 400);
  }

  const journal = entries
    .map((e) => `${e.entry_date} (mood: ${e.mood ?? "n/a"}): ${[e.item_1, e.item_2, e.item_3].filter(Boolean).join("; ")}`)
    .join("\n");

  const prompt = `You are a warm, encouraging gratitude coach. Here are a user's gratitude journal entries from the last 7 days:

${journal}

Find 2-4 short recurring themes (1-3 words each), write a 2-3 sentence summary of what they've been grateful for, and one short encouraging line for next week. Speak directly to the user ("you"). Don't give medical advice.`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              themes: { type: "ARRAY", items: { type: "STRING" } },
              summary: { type: "STRING" },
              encouragement: { type: "STRING" },
            },
            required: ["themes", "summary", "encouragement"],
          },
        },
      }),
    },
  );

  if (!geminiRes.ok) {
    const detail = await geminiRes.text();
    console.error("Gemini error", geminiRes.status, detail);
    return json({ error: `AI request failed (${geminiRes.status})` }, 502);
  }

  const geminiJson = await geminiRes.json();
  const text = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
  let ai: { themes: string[]; summary: string; encouragement: string };
  try {
    ai = JSON.parse(text);
  } catch {
    return json({ error: "AI returned an unexpected response" }, 502);
  }

  const { data: saved, error: saveError } = await supabase
    .from("insights")
    .upsert(
      { user_id: userId, week_start: mondayOf(today), themes: ai.themes, summary: ai.summary, encouragement: ai.encouragement },
      { onConflict: "user_id,week_start" },
    )
    .select()
    .single();
  if (saveError) return json({ error: saveError.message }, 500);

  return json(saved);
});
