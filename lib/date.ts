// All dates are calculated in India time (Asia/Kolkata) so "today" matches the user's day.
const IST_OFFSET_MIN = 5 * 60 + 30;

/** Returns a YYYY-MM-DD string for a Date in IST. */
export function toISTDateString(date: Date = new Date()): string {
  const ist = new Date(date.getTime() + (IST_OFFSET_MIN + date.getTimezoneOffset()) * 60_000);
  const y = ist.getFullYear();
  const m = String(ist.getMonth() + 1).padStart(2, "0");
  const d = String(ist.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const todayInIST = () => toISTDateString();

/** Adds (or subtracts) days to a YYYY-MM-DD string. */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
