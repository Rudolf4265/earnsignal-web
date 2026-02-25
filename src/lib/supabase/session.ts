import { createClient } from "./client";

export async function getSession() {
  const supabase = await createClient();
  return supabase.auth.getSession();
}

export async function onAuthStateChange(
  handler: (event: any, session: any | null) => void,
) {
  const supabase = await createClient();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(handler);

  return () => {
    subscription.unsubscribe();
  };
}
