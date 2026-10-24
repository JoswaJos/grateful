import { z } from "zod";

export const MOODS = ["great", "good", "okay", "low"] as const;
export type Mood = (typeof MOODS)[number];

const item = z.string().trim().max(280, "Keep it under 280 characters");

export const entrySchema = z.object({
  item_1: item.min(1, "Write at least one thing"),
  item_2: item,
  item_3: item,
  mood: z.enum(MOODS).nullable(),
});

export type EntryForm = z.infer<typeof entrySchema>;
