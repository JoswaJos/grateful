import { useClerk, useUser } from "@clerk/clerk-expo";
import { useState } from "react";
import { Alert, Image, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { Screen } from "@/components/screen";
import { useSupabase } from "@/lib/supabase";

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const supabase = useSupabase();
  const [testing, setTesting] = useState(false);

  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  // TEMPORARY: proves Clerk token → Supabase → RLS works. Removed in the data-layer batch.
  const testDb = async () => {
    if (!user) return;
    setTesting(true);
    const { data, error } = await supabase
      .from("users")
      .upsert({ clerk_id: user.id, email, name: user.fullName, image_url: user.imageUrl }, { onConflict: "clerk_id" })
      .select()
      .single();
    setTesting(false);
    if (error) Alert.alert("DB error", error.message);
    else Alert.alert("DB works ✅", `Saved user: ${data.name ?? data.email}`);
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
        {user?.imageUrl ? <Image source={{ uri: user.imageUrl }} className="h-20 w-20 rounded-full" /> : null}
        <Text testID="profile-name" className="mt-3 text-xl font-semibold text-ink">{user?.fullName || "No name"}</Text>
        <Text testID="profile-email" className="mt-1 text-muted">{email}</Text>
      </View>

      <PrimaryButton testID="test-db-button" title="Test DB" variant="outline" loading={testing} onPress={testDb} />
      <PrimaryButton testID="signout-button" title="Sign out" onPress={confirmSignOut} />
    </Screen>
  );
}
