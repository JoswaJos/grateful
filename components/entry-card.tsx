import { format, parseISO } from "date-fns";
import { Pressable, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import { MOOD_META } from "@/lib/moods";
import type { Entry } from "@/lib/types";

type Props = { entry: Entry; onDelete?: (entry: Entry) => void };

export function EntryCard({ entry, onDelete }: Props) {
  const items = [entry.item_1, entry.item_2, entry.item_3].filter(Boolean) as string[];
  return (
    <View testID={`entry-${entry.entry_date}`} className="mb-3 rounded-2xl bg-surface p-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="font-semibold text-ink">
          {format(parseISO(entry.entry_date), "EEE, d MMM yyyy")}
          {entry.mood ? `  ${MOOD_META[entry.mood].emoji}` : ""}
        </Text>
        {onDelete ? (
          <Pressable testID={`delete-${entry.entry_date}`} hitSlop={12} onPress={() => onDelete(entry)}>
            <Feather name="trash-2" size={18} color="#8A8580" />
          </Pressable>
        ) : null}
      </View>
      {items.map((t, i) => (
        <Text key={i} className="mb-1 text-base text-ink">• {t}</Text>
      ))}
    </View>
  );
}
