"use client";

import { createClient } from "./client";

export async function signInWithGoogle(opts?: { redirectTo?: string; returnTo?: string | null }) {
  let supabase;

  try {
    supabase = createClient();
  } catch (err) {
    console.error("[auth] supabase init failed", err);
    throw err;
  }

  const fallbackRedirectTo = `${window.location.origin}/auth/callback`;
  const redirectBase = opts?.redirectTo ?? fallbackRedirectTo;
  const callbackUrl = new URL(redirectBase, window.location.origin);

  if (opts?.returnTo) {
    callbackUrl.searchParams.set("returnTo", opts.returnTo);
  }

  const redirectTo = callbackUrl.toString();

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
