import { addDays } from "./date";

/**
 * Counts consecutive days with an entry.
 * The streak stays "alive" if the last entry was today OR yesterday,
 * so it doesn't drop to 0 in the morning before you write.
 * Pure function: same input → same output, easy to unit test.
 */
export function getStreak(dates: string[], today: string): number {
  const set = new Set(dates);
  let cursor = set.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
