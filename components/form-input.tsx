import { Text, TextInput, View, type TextInputProps } from "react-native";

type Props = TextInputProps & { label: string; error?: string };

// A labelled text input with an error message underneath.
export function FormInput({ label, error, ...props }: Props) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-ink">{label}</Text>
      <TextInput
        className={`rounded-2xl border bg-surface px-4 py-3 text-base text-ink ${error ? "border-red-400" : "border-transparent"}`}
        placeholderTextColor="#8A8580"
        {...props}
      />
      {error ? <Text className="mt-1 text-sm text-red-500">{error}</Text> : null}
    </View>
  );
}
