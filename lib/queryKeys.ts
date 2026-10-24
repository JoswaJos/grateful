// Query keys are the "addresses" of cached data in React Query.
// Putting userId in every key means two users never share a cache.
export const queryKeys = {
  entries: {
    all: (userId: string) => ["entries", userId] as const,
    today: (userId: string, date: string) => ["entries", userId, "day", date] as const,
  },
  insights: {
    latest: (userId: string) => ["insights", userId, "latest"] as const,
  },
};
