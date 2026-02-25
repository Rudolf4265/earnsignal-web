import { createClient } from "./client";

export async function signInWithGoogle(redirectTo?: string): Promise<void> {
  let supabase;

  try {
    supabase = await createClient();
  } catch {
    throw new Error(
      "Supabase client not available. Install @supabase/supabase-js and set NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const finalRedirectTo = redirectTo ?? `${origin}/auth/callback`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: finalRedirectTo,
    },
  });

  if (error) {
    throw error;
  }
}
