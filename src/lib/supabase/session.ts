import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "./client";

export async function getSession() {
  const supabase = await createBrowserSupabaseClient();
  return supabase.auth.getSession();
}

export async function onAuthStateChange(
  handler: (event: AuthChangeEvent, session: Session | null) => void,
) {
  const supabase = await createBrowserSupabaseClient();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(handler);

  return () => {
    subscription.unsubscribe();
  };
}
