let _client: any | null = null;

function getRequiredPublicEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing ${name}. Set this environment variable in Vercel project settings to enable authentication.`,
    );
  }

  return value;
}

const dynamicImporter = new Function("specifier", "return import(specifier)") as (
  specifier: string,
) => Promise<any>;

export async function createClient() {
  if (_client) {
    return _client;
  }

  const supabaseUrl = getRequiredPublicEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = getRequiredPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  try {
    const supabaseModule = await dynamicImporter("@supabase/supabase-js");
    const createSupabaseClient = supabaseModule.createClient;

    _client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    return _client;
  } catch {
    throw new Error(
      "Supabase client not available. Install @supabase/supabase-js and set NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
}
