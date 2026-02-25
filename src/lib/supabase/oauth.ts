"use client";

import { createClient } from "./client";

export async function signInWithGoogle(opts?: { redirectTo?: string }) {
  let supabase;

  try {
    supabase = createClient();
  } catch (err) {
    console.error("[auth] supabase init failed", err);
    throw err;
  }

  const redirectTo = opts?.redirectTo ?? `${window.location.origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    console.error("[auth] google oauth start failed", error);
    throw error;
  }

  return data;
}
