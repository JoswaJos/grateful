import { useSession } from "@clerk/clerk-expo";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env");
}

/**
 * Returns a Supabase client that sends the signed-in user's Clerk token
 * with every request. Supabase (with Clerk enabled as third-party auth)
 * verifies it, and RLS uses auth.jwt()->>'sub' (the Clerk user id)
 * so each user can only touch their own rows.
 */
export function useSupabase(): SupabaseClient {
  const { session } = useSession();

  return useMemo(
    () =>
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        accessToken: async () => (await session?.getToken()) ?? null,
      }),
    [session],
  );
}
