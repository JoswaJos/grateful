// Weekly digest email — runs every Monday from pg_cron (not from the app).
// Uses the SERVICE ROLE key (admin) because it must read every user's entries.
// That's why it's protected by a secret header (CRON_SECRET): only our cron job knows it.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!; // provided automatically by Supabase
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";
// Resend's test sender works until you verify your own domain.
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "Grateful <onboarding@resend.dev>";
// DEV ONLY: while using Resend's test sender, send every digest to this address instead.
// Remove this secret once you verify your own domain in Resend.
const TEST_EMAIL_OVERRIDE = Deno.env.get("TEST_EMAIL_OVERRIDE");

const istToday = () => new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
const addDays = (d: string, n: number) => {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day + n)).toISOString().slice(0, 10);
};
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type Entry = { user_id: string; entry_date: string; item_1: string; item_2: string | null; item_3: string | null; mood: string | null };
type AI = { themes: string[]; summary: string; encouragement: string };

async function summarize(entries: Entry[]): Promise<AI | null> {
  const journal = entries
    .map((e) => `${e.entry_date} (mood: ${e.mood ?? "n/a"}): ${[e.item_1, e.item_2, e.item_3].filter(Boolean).join("; ")}`)
    .join("\n");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `You are a warm gratitude coach. Entries from the past week:\n\n${journal}\n\nGive 2-4 short themes, a 2-3 sentence summary speaking to the user as "you", and one encouraging line for next week.` }] }],
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
  });
  if (!res.ok) return null;
  try {
    return JSON.parse((await res.json())?.candidates?.[0]?.content?.parts?.[0]?.text);
  } catch {
    return null;
  }
}

function emailHtml(name: string, count: number, ai: AI | null, entries: Entry[]) {
  const themes = (ai?.themes ?? []).map((t) => `<span style="display:inline-block;background:#FFF8F0;color:#F4845F;border-radius:999px;padding:4px 12px;margin:0 6px 6px 0;font-size:13px;font-weight:600">${escapeHtml(t)}</span>`).join("");
  const highlights = entries.slice(-3).map((e) => `<li style="margin-bottom:6px">${escapeHtml(e.item_1)}</li>`).join("");
  return `<!doctype html><html><body style="margin:0;background:#FFF8F0;font-family:Arial,Helvetica,sans-serif;color:#2D2A26">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px">
    <h1 style="font-size:24px;margin:0 0 4px">Your week in gratitude 🌱</h1>
    <p style="color:#8A8580;margin:0 0 24px">Hi ${escapeHtml(name)}, you wrote ${count} ${count === 1 ? "entry" : "entries"} this week.</p>
    <div style="background:#fff;border-radius:16px;padding:20px">
      ${themes ? `<div style="margin-bottom:12px">${themes}</div>` : ""}
      ${ai ? `<p style="line-height:1.6;margin:0 0 12px">${escapeHtml(ai.summary)}</p><p style="font-style:italic;color:#8A8580;margin:0">${escapeHtml(ai.encouragement)}</p>` : ""}
    </div>
    ${highlights ? `<h3 style="margin:24px 0 8px">A few highlights</h3><ul style="padding-left:20px;margin:0">${highlights}</ul>` : ""}
    <p style="color:#8A8580;font-size:12px;margin-top:32px">Keep going — open Grateful and write today's three things.</p>
  </div></body></html>`;
}

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const since = addDays(istToday(), -7);

  const { data: entries, error } = await admin
    .from("entries")
    .select("user_id, entry_date, item_1, item_2, item_3, mood")
    .gte("entry_date", since)
    .order("entry_date");
  if (error) return new Response(error.message, { status: 500 });

  // Group entries by user
  const byUser = new Map<string, Entry[]>();
  for (const e of entries ?? []) byUser.set(e.user_id, [...(byUser.get(e.user_id) ?? []), e]);
  if (byUser.size === 0) return Response.json({ sent: 0, note: "No entries this week" });

  const { data: users } = await admin.from("users").select("clerk_id, email, name").in("clerk_id", [...byUser.keys()]);

  let sent = 0;
  const failures: string[] = [];
  for (const u of users ?? []) {
    if (!u.email) continue;
    const userEntries = byUser.get(u.clerk_id)!;
    const ai = userEntries.length >= 2 ? await summarize(userEntries) : null;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TEST_EMAIL_OVERRIDE || u.email],
        subject: "Your week in gratitude 🌱",
        html: emailHtml(u.name ?? "there", userEntries.length, ai, userEntries),
      }),
    });
    if (res.ok) sent++;
    else failures.push(`${u.email}: ${res.status} ${await res.text()}`);
  }

  console.log({ sent, failures });
  return Response.json({ sent, failures });
});
