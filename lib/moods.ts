import type { Mood } from "@/lib/schemas/entry";

export const MOOD_META: Record<Mood, { emoji: string; label: string }> = {
  great: { emoji: "😄", label: "Great" },
  good: { emoji: "🙂", label: "Good" },
  okay: { emoji: "😐", label: "Okay" },
  low: { emoji: "😔", label: "Low" },
};
