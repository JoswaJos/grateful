import { Text } from "react-native";

import { Screen } from "@/components/screen";

export default function ProfileScreen() {
  return (
    <Screen>
      <Text className="mt-4 text-3xl font-bold text-ink">Profile</Text>
      <Text className="mt-1 text-base text-muted">Your account and settings.</Text>
    </Screen>
  );
}
