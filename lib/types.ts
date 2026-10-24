// TypeScript shapes that mirror the Supabase tables.
export type Mood = "great" | "good" | "okay" | "low";

export type User = {
  clerk_id: string;
  email: string | null;
  name: string | null;
  image_url: string | null;
  reminder_time: string | null;
  created_at: string;
};

export type Entry = {
  id: string;
  user_id: string;
  item_1: string;
  item_2: string | null;
  item_3: string | null;
  mood: Mood | null;
  entry_date: string; // YYYY-MM-DD
  created_at: string;
};

export type Insight = {
  id: string;
  user_id: string;
  week_start: string;
  themes: string[] | null;
  summary: string | null;
  encouragement: string | null;
  created_at: string;
};
