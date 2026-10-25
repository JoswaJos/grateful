import { useUser } from "@clerk/clerk-expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";

import { queryKeys } from "@/lib/queryKeys";
import { useSupabase } from "@/lib/supabase";
import type { Insight } from "@/lib/types";

/** Calls the generate-insights Edge Function (which calls Gemini) and refreshes the cache. */
export function useGenerateInsights() {
  const { user } = useUser();
  const supabase = useSupabase();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<Insight> => {
      const { data, error } = await supabase.functions.invoke("generate-insights", { method: "POST" });
      if (error) {
        // Pull the friendly message our function returned, e.g. "Write at least 2 entries…"
        if (error instanceof FunctionsHttpError) {
          const body = await error.context.json().catch(() => null);
          throw new Error(body?.error ?? error.message);
        }
        throw error;
      }
      return data as Insight;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.insights.latest(user?.id ?? "") }),
  });
}
