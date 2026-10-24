import { useClerk, useUser } from "@clerk/clerk-expo";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { useEntriesQuery } from "@/hooks/useEntries";
import { useStreak } from "@/hooks/useStreak";

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { data: entries } = useEntriesQuery();
  const streak = useStreak();

  const [uploading, setUploading] = useState(false);

  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  // Pick a photo and upload it to Clerk as the profile image.
  const changeAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;
    try {
      setUploading(true);
      const asset = result.assets[0];
      await user?.setProfileImage({ file: `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}` });
      await user?.reload();
    } catch (e) {
      Alert.alert("Couldn't update photo", (e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const confirmSignOut = () =>
    Alert.alert("Sign out?", "You can sign back in anytime.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);

  return (
    <Screen>
      <Text className="mt-4 text-3xl font-bold text-ink">Profile</Text>

      <View className="mt-6 items-center rounded-2xl bg-surface p-6">
        <Pressable testID="avatar-button" onPress={changeAvatar} className="items-center">
          {uploading ? (
            <View className="h-20 w-20 items-center justify-center rounded-full bg-cream"><ActivityIndicator color="#F4845F" /></View>
          ) : user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} className="h-20 w-20 rounded-full" />
          ) : null}
          <Text className="mt-2 text-sm text-accent">Change photo</Text>
        </Pressable>
        <Text testID="profile-name" className="mt-3 text-xl font-semibold text-ink">{user?.fullName || "No name"}</Text>
        <Text testID="profile-email" className="mt-1 text-muted">{email}</Text>
      </View>

      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 items-center rounded-2xl bg-surface p-4">
          <Text testID="profile-entries" className="text-2xl font-bold text-ink">{entries?.length ?? 0}</Text>
          <Text className="text-muted">Entries</Text>
        </View>
        <View className="flex-1 items-center rounded-2xl bg-surface p-4">
          <Text testID="profile-streak" className="text-2xl font-bold text-ink">{streak} 🔥</Text>
          <Text className="text-muted">Day streak</Text>
        </View>
      </View>

      <PrimaryButton testID="signout-button" title="Sign out" onPress={confirmSignOut} />
    </Screen>
  );
}
