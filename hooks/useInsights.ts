import { useUser } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import { useSupabase } from "@/lib/supabase";
import type { Insight } from "@/lib/types";

/** The most recent weekly AI insight (filled in by the AI batch later). */
export function useInsightsQuery() {
  const { user } = useUser();
  const supabase = useSupabase();
  return useQuery({
    queryKey: queryKeys.insights.latest(user?.id ?? ""),
    enabled: !!user,
    queryFn: async (): Promise<Insight | null> => {
      const { data, error } = await supabase
        .from("insights")
        .select("*")
        .order("week_start", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
