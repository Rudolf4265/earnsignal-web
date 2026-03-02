"use client";

import { createClient } from "./client";
import { appBaseUrl } from "@/src/lib/urls";
import { isAllowedAuthOrigin } from "@/src/lib/config/domains";

export async function signInWithGoogle(opts?: { redirectTo?: string; returnTo?: string | null }) {
  let supabase;

  try {
    supabase = createClient();
  } catch (err) {
    console.error("[auth] supabase init failed", err);
    throw err;
  }

  const browserOrigin = window.location.origin;
  const fallbackRedirectTo = `${appBaseUrl}/auth/callback`;
  const redirectBase = opts?.redirectTo ?? (isAllowedAuthOrigin(browserOrigin) ? `${browserOrigin}/auth/callback` : fallbackRedirectTo);
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
