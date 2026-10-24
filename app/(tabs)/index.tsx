import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput } from "react-native";

import { Screen } from "@/components/screen";

const PROMPTS = ["I'm grateful for…", "Something that made me smile…", "Someone I appreciate…"];

export default function TodayScreen() {
  const [entries, setEntries] = useState(["", "", ""]);

  const updateEntry = (index: number, text: string) =>
    setEntries((prev) => prev.map((value, i) => (i === index ? text : value)));

  const handleSave = () => {
    if (entries.every((e) => !e.trim())) {
      Alert.alert("Nothing to save", "Write at least one thing you're grateful for.");
      return;
    }
    Alert.alert("Saved", "Your gratitude entry has been saved.");
    setEntries(["", "", ""]);
  };

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-10">
        <Text className="mt-4 text-3xl font-bold text-ink">Today</Text>
        <Text className="mb-6 mt-1 text-base text-muted">Three good things.</Text>

        {entries.map((value, i) => (
          <TextInput
            key={i}
            testID={`gratitude-input-${i + 1}`}
            className="mb-4 min-h-24 rounded-2xl bg-surface p-4 text-base text-ink"
            placeholder={PROMPTS[i]}
            placeholderTextColor="#8A8580"
            multiline
            textAlignVertical="top"
            value={value}
            onChangeText={(text) => updateEntry(i, text)}
          />
        ))}

        <Pressable
          testID="save-button"
          onPress={handleSave}
          className="mt-2 items-center rounded-2xl bg-accent py-4 active:opacity-80"
        >
          <Text className="text-base font-semibold text-surface">Save</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
