import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-only Supabase client for App Router client components.
 *
 * IMPORTANT: keep NEXT_PUBLIC_* reads as static property access.
 * Next.js only inlines static references like process.env.NEXT_PUBLIC_SUPABASE_URL.
 * Dynamic indexing (e.g. process.env[name]) leaks a runtime process reference into the
 * browser bundle and can cause `process is not defined` errors.
 */

let _client: SupabaseClient | null = null;

function readSupabasePublicEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Set this NEXT_PUBLIC_ variable in deployment settings and redeploy because NEXT_PUBLIC_* values are inlined at build time.",
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Set this NEXT_PUBLIC_ variable in deployment settings and redeploy because NEXT_PUBLIC_* values are inlined at build time.",
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function createClient(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error(
      "Supabase browser client cannot be created on the server. Use a browser/client auth helper for client components.",
    );
  }

  if (_client) {
    return _client;
  }

  const { supabaseUrl, supabaseAnonKey } = readSupabasePublicEnv();

  _client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return _client;
}
