import { Redirect } from "expo-router";

// Verification now happens inside sign-up.tsx. Kept so old links still work.
export default function VerifyScreen() {
  return <Redirect href="/sign-up" />;
}
