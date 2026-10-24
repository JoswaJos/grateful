import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";

// Guard: signed-in users never see the auth screens.
export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (isSignedIn) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
