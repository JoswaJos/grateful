import { ActivityIndicator, Pressable, Text } from "react-native";

type Props = { title: string; onPress: () => void; loading?: boolean; testID?: string; variant?: "primary" | "outline" };

export function PrimaryButton({ title, onPress, loading, testID, variant = "primary" }: Props) {
  const outline = variant === "outline";
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={loading}
      className={`mt-2 items-center rounded-2xl py-4 active:opacity-80 ${outline ? "border border-accent" : "bg-accent"} ${loading ? "opacity-60" : ""}`}
    >
      {loading ? (
        <ActivityIndicator color={outline ? "#F4845F" : "#FFFFFF"} />
      ) : (
        <Text className={`text-base font-semibold ${outline ? "text-accent" : "text-surface"}`}>{title}</Text>
      )}
    </Pressable>
  );
}
