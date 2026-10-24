import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { todayInIST } from "@/lib/date";
import { queryKeys } from "@/lib/queryKeys";
import type { EntryForm } from "@/lib/schemas/entry";
import { useSupabase } from "@/lib/supabase";
import type { Entry } from "@/lib/types";

/** All of the user's entries, newest first. */
export function useEntriesQuery() {
  const { user } = useUser();
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.entries.all(user?.id ?? ""),
    enabled: !!user,
    queryFn: async (): Promise<Entry[]> => {
      const { data, error } = await supabase.from("entries").select("*").order("entry_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/** Today's entry (or null if not written yet). */
export function useTodayEntryQuery() {
  const { user } = useUser();
  const supabase = useSupabase();
  const today = todayInIST();
  return useQuery({
    queryKey: queryKeys.entries.today(user?.id ?? "", today),
    enabled: !!user,
    queryFn: async (): Promise<Entry | null> => {
      const { data, error } = await supabase.from("entries").select("*").eq("entry_date", today).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Create or update today's entry.
 * "Upsert" = insert if missing, update if it exists — the UNIQUE(user_id, entry_date)
 * constraint tells Postgres which row is "the same one".
 */
export function useSaveEntry() {
  const { user } = useUser();
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EntryForm & { entry_date?: string }) => {
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("entries")
        .upsert(
          {
            user_id: user.id,
            entry_date: input.entry_date ?? todayInIST(),
            item_1: input.item_1,
            item_2: input.item_2 || null,
            item_3: input.item_3 || null,
            mood: input.mood,
          },
          { onConflict: "user_id,entry_date" },
        )
        .select()
        .single();
      if (error) throw error;
      return data as Entry;
    },
    // Invalidation = "this cached data is stale, refetch it". Every entries.* key starts with ["entries", userId].
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.entries.all(user?.id ?? "") }),
  });
}

export function useDeleteEntry() {
  const { user } = useUser();
  const supabase = useSupabase();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.entries.all(user?.id ?? "") }),
  });
}
