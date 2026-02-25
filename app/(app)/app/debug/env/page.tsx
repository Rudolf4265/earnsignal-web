"use client";

function maskSecret(value: string | undefined): string {
  if (!value) {
    return "(missing)";
  }

  if (value.length <= 8) {
    return `${value[0] ?? ""}***${value.at(-1) ?? ""}`;
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export default function EnvDebugPage() {
  const values = {
    origin: typeof window === "undefined" ? "(server render)" : window.location.origin,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(missing)",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: maskSecret(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "(missing)",
    NEXT_PUBLIC_MARKETING_HOST: process.env.NEXT_PUBLIC_MARKETING_HOST ?? "(missing)",
    NEXT_PUBLIC_APP_HOST: process.env.NEXT_PUBLIC_APP_HOST ?? "(missing)",
    VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA ?? "(missing)",
    VERCEL_ENV: process.env.VERCEL_ENV ?? "(missing)",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Environment Debug</h1>
        <p className="mt-2 text-sm text-gray-400">
          Use this page to verify which env values were inlined into the client bundle at build time.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-navy-900">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <tbody className="divide-y divide-white/10">
            {Object.entries(values).map(([key, value]) => (
              <tr key={key}>
                <th className="w-64 px-4 py-3 text-left font-medium text-gray-300">{key}</th>
                <td className="px-4 py-3 font-mono text-xs text-gray-100">{value || "(missing)"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
