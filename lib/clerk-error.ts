// Clerk throws errors shaped like { errors: [{ longMessage, message }] }.
// This pulls out a human-readable message for an Alert or inline text.
export function clerkErrorMessage(err: unknown): string {
  const e = err as { errors?: { longMessage?: string; message?: string }[] };
  return e?.errors?.[0]?.longMessage ?? e?.errors?.[0]?.message ?? "Something went wrong. Please try again.";
}
