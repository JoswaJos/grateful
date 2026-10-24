import { Text } from "react-native";

import { Screen } from "@/components/screen";

export default function InsightsScreen() {
  return (
    <Screen>
      <Text className="mt-4 text-3xl font-bold text-ink">Insights</Text>
      <Text className="mt-1 text-base text-muted">Patterns in your gratitude will appear here.</Text>
    </Screen>
  );
}
