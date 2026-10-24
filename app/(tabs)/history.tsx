import { Text } from "react-native";

import { Screen } from "@/components/screen";

export default function HistoryScreen() {
  return (
    <Screen>
      <Text className="mt-4 text-3xl font-bold text-ink">History</Text>
      <Text className="mt-1 text-base text-muted">Your past entries will appear here.</Text>
    </Screen>
  );
}
