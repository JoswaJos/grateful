import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";

import { Screen } from "@/components/screen";
import { useEntriesQuery } from "@/hooks/useEntries";
import { useGenerateInsights } from "@/hooks/useGenerateInsights";
import { useInsightsQuery } from "@/hooks/useInsights";
import { useStreak } from "@/hooks/useStreak";
import { todayInIST } from "@/lib/date";
import { MOOD_META } from "@/lib/moods";
import { MOODS } from "@/lib/schemas/entry";

export default function InsightsScreen() {
  const { data: entries = [] } = useEntriesQuery();
  const streak = useStreak();
  const { data: insight, isLoading: insightLoading } = useInsightsQuery();
  const generate = useGenerateInsights();

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

        <Text className="mb-3 mt-8 text-lg font-semibold text-ink">✨ Weekly AI insight</Text>
        <View testID="ai-card" className="rounded-2xl bg-surface p-5">
          {insightLoading || generate.isPending ? (
            <View className="items-center py-6">
              <ActivityIndicator color="#F4845F" />
              <Text className="mt-2 text-muted">{generate.isPending ? "Reading your week…" : "Loading…"}</Text>
            </View>
          ) : insight ? (
            <>
              <Text className="text-xs text-muted">Week of {format(parseISO(insight.week_start), "d MMM yyyy")}</Text>
              <View className="mt-3 flex-row flex-wrap gap-2">
                {(insight.themes ?? []).map((t) => (
                  <View key={t} className="rounded-full bg-cream px-3 py-1">
                    <Text testID="ai-theme" className="text-sm font-medium text-accent">{t}</Text>
                  </View>
                ))}
              </View>
              <Text testID="ai-summary" className="mt-4 text-base leading-6 text-ink">{insight.summary}</Text>
              {insight.encouragement ? <Text className="mt-3 italic text-muted">{insight.encouragement}</Text> : null}
            </>
          ) : (
            <Text className="text-muted">Get themes and a summary of what you've been grateful for this week.</Text>
          )}

          {generate.error ? <Text testID="ai-error" className="mt-3 text-red-500">{(generate.error as Error).message}</Text> : null}

          <PrimaryButton
            testID="generate-insight-button"
            title={insight ? "Refresh this week's insight" : "Generate my weekly insight"}
            loading={generate.isPending}
            onPress={() => generate.mutate()}
          />
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
