import { create } from "zustand";

// Zustand = a tiny global store for app/UI state that isn't server data.
// Server data (entries, insights) lives in React Query instead.
type UserState = {
  reminderTime: string | null;
  setReminderTime: (t: string | null) => void;
  needsOnboarding: boolean;
  setNeedsOnboarding: (v: boolean) => void;
};

export const useUserStore = create<UserState>((set) => ({
  reminderTime: null,
  setReminderTime: (reminderTime) => set({ reminderTime }),
  needsOnboarding: false,
  setNeedsOnboarding: (needsOnboarding) => set({ needsOnboarding }),
}));
