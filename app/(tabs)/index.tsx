import { format } from "date-fns";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";

import { EntryCard } from "@/components/entry-card";
import { MoodPicker } from "@/components/mood-picker";
import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { useSaveEntry, useTodayEntryQuery } from "@/hooks/useEntries";
import { useStreak } from "@/hooks/useStreak";
import { entrySchema, type Mood } from "@/lib/schemas/entry";

const PROMPTS = ["I'm grateful for…", "Something that made me smile…", "Someone I appreciate…"];

export default function TodayScreen() {
  const { data: todayEntry, isLoading, error } = useTodayEntryQuery();
  const save = useSaveEntry();
  const streak = useStreak();

  const [items, setItems] = useState(["", "", ""]);
  const [mood, setMood] = useState<Mood | null>(null);
  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState("");

  // When today's entry loads, prefill the form (used when editing).
  useEffect(() => {
    if (todayEntry) {
      setItems([todayEntry.item_1, todayEntry.item_2 ?? "", todayEntry.item_3 ?? ""]);
      setMood(todayEntry.mood);
    }
  }, [todayEntry]);

  const update = (i: number, text: string) => setItems((prev) => prev.map((v, idx) => (idx === i ? text : v)));

  const handleSave = () => {
    // Move any filled items to the top so item_1 is always set.
    const filled = items.map((t) => t.trim()).filter(Boolean);
    const parsed = entrySchema.safeParse({ item_1: filled[0] ?? "", item_2: filled[1] ?? "", item_3: filled[2] ?? "", mood });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Please check your entry");
      return;
    }
    setFormError("");
    save.mutate(parsed.data, {
      onSuccess: () => {
        setEditing(false);
        Alert.alert("Saved 🌱", "Nice work. See you tomorrow!");
      },
      onError: (e) => Alert.alert("Couldn't save", (e as Error).message),
    });
  };

  const showForm = !todayEntry || editing;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="pb-10">
          <View className="mt-4 flex-row items-center justify-between">
            <Text className="text-3xl font-bold text-ink">Today</Text>
            <View className="rounded-full bg-surface px-3 py-1">
              <Text testID="today-streak" className="font-semibold text-ink">{streak} 🔥</Text>
            </View>
          </View>
          <Text className="mb-6 mt-1 text-base text-muted">{format(new Date(), "EEEE, d MMMM")}</Text>

          {isLoading ? (
            <ActivityIndicator color="#F4845F" />
          ) : error ? (
            <Text className="text-red-500">Couldn't load today: {(error as Error).message}</Text>
          ) : showForm ? (
            <>
              {items.map((value, i) => (
                <TextInput
                  key={i}
                  testID={`gratitude-input-${i + 1}`}
                  className="mb-4 min-h-24 rounded-2xl bg-surface p-4 text-base text-ink"
                  placeholder={PROMPTS[i]}
                  placeholderTextColor="#8A8580"
                  multiline
                  maxLength={280}
                  textAlignVertical="top"
                  value={value}
                  onChangeText={(t) => update(i, t)}
                />
              ))}
              <Text className="mb-2 font-medium text-ink">How do you feel?</Text>
              <MoodPicker value={mood} onChange={setMood} />
              {formError ? <Text testID="today-error" className="mb-2 text-red-500">{formError}</Text> : null}
              <PrimaryButton testID="save-button" title={todayEntry ? "Update" : "Save"} loading={save.isPending} onPress={handleSave} />
              {editing ? <PrimaryButton title="Cancel" variant="outline" onPress={() => setEditing(false)} /> : null}
            </>
          ) : (
            <>
              <Text className="mb-3 text-base text-muted">You've written today ✨</Text>
              <EntryCard entry={todayEntry!} />
              <PrimaryButton testID="edit-button" title="Edit today's entry" variant="outline" onPress={() => setEditing(true)} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
