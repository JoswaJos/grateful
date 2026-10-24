import { useUser } from "@clerk/clerk-expo";
import { useEffect, useRef } from "react";

import { useSupabase } from "@/lib/supabase";

/**
 * Copies the signed-in Clerk user into our Supabase `users` table once per session.
 * Entries reference users.clerk_id, so this row must exist before saving entries.
 */
export function useUserSync() {
  const { user, isLoaded } = useUser();
  const supabase = useSupabase();
  const synced = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user || synced.current === user.id) return;
    synced.current = user.id;

    supabase
      .from("users")
      .upsert(
        {
          clerk_id: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? null,
          name: user.fullName,
          image_url: user.imageUrl,
        },
        { onConflict: "clerk_id" },
      )
      .then(({ error }) => {
        if (error) {
          console.warn("User sync failed:", error.message);
          synced.current = null; // allow a retry next render
        }
      });
  }, [isLoaded, user, supabase]);
}
