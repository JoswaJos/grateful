import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, RefreshControl, Text, TextInput, View } from "react-native";

import { EntryCard } from "@/components/entry-card";
import { Screen } from "@/components/screen";
import { useDeleteEntry, useEntriesQuery } from "@/hooks/useEntries";
import type { Entry } from "@/lib/types";

export default function HistoryScreen() {
  const { data, isLoading, error, refetch, isRefetching } = useEntriesQuery();
  const del = useDeleteEntry();
  const [search, setSearch] = useState("");

  // Filter on the device — fine for a personal journal's size.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter((e) => [e.item_1, e.item_2, e.item_3].some((t) => t?.toLowerCase().includes(q)));
  }, [data, search]);

  const confirmDelete = (entry: Entry) =>
    Alert.alert("Delete this entry?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => del.mutate(entry.id, { onError: (e) => Alert.alert("Couldn't delete", (e as Error).message) }),
      },
    ]);

  return (
    <Screen>
      <Text className="mt-4 text-3xl font-bold text-ink">History</Text>
      <TextInput
        testID="history-search"
        className="my-4 rounded-2xl bg-surface px-4 py-3 text-base text-ink"
        placeholder="Search your entries"
        placeholderTextColor="#8A8580"
        value={search}
        onChangeText={setSearch}
      />

      {isLoading ? (
        <ActivityIndicator color="#F4845F" />
      ) : error ? (
        <Text className="text-red-500">Couldn't load entries: {(error as Error).message}</Text>
      ) : (
        <FlatList
          testID="history-list"
          data={filtered}
          keyExtractor={(e) => e.id}
          renderItem={({ item }) => <EntryCard entry={item} onDelete={confirmDelete} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#F4845F" />}
          contentContainerClassName="pb-10"
          ListEmptyComponent={
            <View className="mt-16 items-center">
              <Text className="text-4xl">📖</Text>
              <Text className="mt-2 text-muted">{search ? "No entries match your search." : "No entries yet. Write your first one today!"}</Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}
