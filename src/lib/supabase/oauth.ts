"use client";

import { createClient } from "./client";

export async function signInWithGoogle(opts?: { redirectTo?: string }) {
  try {
    const supabase = createClient();

    const redirectTo =
      opts?.redirectTo ?? `${window.location.origin}/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (err) {
    // IMPORTANT: do not mask the real error (env missing, module load, config, etc.)
    console.error("signInWithGoogle failed:", err);
    throw err;
  }
}