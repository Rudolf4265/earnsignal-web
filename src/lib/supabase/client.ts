import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getRequiredPublicEnv(
  name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
) {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing ${name}. Set this NEXT_PUBLIC_ variable in Vercel project settings and redeploy, because NEXT_PUBLIC_* values are inlined at build time.`
    );
  }

  return value;
}

export function createClient(): SupabaseClient {
  if (_client) {
    return _client;
  }

  const supabaseUrl = getRequiredPublicEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = getRequiredPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  try {
    _client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    return _client;
  } catch (err) {
    console.error("Supabase initialization failed:", err);
    throw err;
  }
}