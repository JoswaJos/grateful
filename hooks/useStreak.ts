import { useMemo } from "react";

import { todayInIST } from "@/lib/date";
import { getStreak } from "@/lib/streak";

import { useEntriesQuery } from "./useEntries";

export function useStreak() {
  const { data } = useEntriesQuery();
  return useMemo(() => getStreak((data ?? []).map((e) => e.entry_date), todayInIST()), [data]);
}
