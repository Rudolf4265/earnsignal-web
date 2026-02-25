import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createClient } from "./client";

export async function getSession() {
  const supabase = await createClient();
  return supabase.auth.getSession();
}

export async function onAuthStateChange(
  handler: (event: AuthChangeEvent, session: Session | null) => void,
) {
  const supabase = await createClient();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(handler);

  return () => {
    subscription.unsubscribe();
  };
}
