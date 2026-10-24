import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";

import { Screen } from "@/components/screen";
import { useEntriesQuery } from "@/hooks/useEntries";
import { useStreak } from "@/hooks/useStreak";
import { todayInIST } from "@/lib/date";
import { MOOD_META } from "@/lib/moods";
import { MOODS } from "@/lib/schemas/entry";

export default function InsightsScreen() {
  const { data: entries = [] } = useEntriesQuery();
  const streak = useStreak();

  // Mood counts for the current month (YYYY-MM prefix match).
  const month = todayInIST().slice(0, 7);
  const moodCounts = useMemo(() => {
    const counts = Object.fromEntries(MOODS.map((m) => [m, 0])) as Record<(typeof MOODS)[number], number>;
    entries.filter((e) => e.entry_date.startsWith(month) && e.mood).forEach((e) => counts[e.mood!]++);
    return counts;
  }, [entries, month]);
  const maxCount = Math.max(1, ...Object.values(moodCounts));
  const thisMonth = entries.filter((e) => e.entry_date.startsWith(month)).length;

  return (
    <Screen>
      <ScrollView contentContainerClassName="pb-10">
        <Text className="mt-4 text-3xl font-bold text-ink">Insights</Text>

        <View className="mt-6 flex-row gap-3">
          <Stat testID="stat-streak" value={`${streak} 🔥`} label="Day streak" />
          <Stat testID="stat-total" value={String(entries.length)} label="Total entries" />
          <Stat testID="stat-month" value={String(thisMonth)} label="This month" />
        </View>

        <Text className="mb-3 mt-8 text-lg font-semibold text-ink">Mood this month</Text>
        <View className="rounded-2xl bg-surface p-4">
          {MOODS.map((m) => (
            <View key={m} className="mb-3 flex-row items-center">
              <Text className="w-10 text-2xl">{MOOD_META[m].emoji}</Text>
              <View className="h-4 flex-1 overflow-hidden rounded-full bg-cream">
                <View className="h-4 rounded-full bg-accent" style={{ width: `${(moodCounts[m] / maxCount) * 100}%` }} />
              </View>
              <Text className="w-8 text-right text-ink">{moodCounts[m]}</Text>
            </View>
          ))}
        </View>

        <View className="mt-8 rounded-2xl border border-dashed border-accent p-5">
          <Text className="text-lg font-semibold text-ink">✨ AI insights</Text>
          <Text className="mt-1 text-muted">Weekly themes from your entries are coming soon.</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Stat({ value, label, testID }: { value: string; label: string; testID: string }) {
  return (
    <View className="flex-1 items-center rounded-2xl bg-surface p-4">
      <Text testID={testID} className="text-2xl font-bold text-ink">{value}</Text>
      <Text className="mt-1 text-center text-xs text-muted">{label}</Text>
    </View>
  );
}
