import { Pressable, Text, View } from "react-native";

import { MOOD_META } from "@/lib/moods";
import { MOODS, type Mood } from "@/lib/schemas/entry";

type Props = { value: Mood | null; onChange: (m: Mood | null) => void };

export function MoodPicker({ value, onChange }: Props) {
  return (
    <View className="mb-4 flex-row justify-between">
      {MOODS.map((m) => {
        const selected = value === m;
        return (
          <Pressable
            key={m}
            testID={`mood-${m}`}
            onPress={() => onChange(selected ? null : m)}
            className={`w-[23%] items-center rounded-2xl py-3 ${selected ? "bg-accent" : "bg-surface"}`}
          >
            <Text className="text-2xl">{MOOD_META[m].emoji}</Text>
            <Text className={`mt-1 text-xs ${selected ? "font-semibold text-surface" : "text-muted"}`}>{MOOD_META[m].label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
