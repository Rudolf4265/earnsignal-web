"use client";

function maskAnonKey(value: string | undefined): string {
  if (!value) {
    return "(missing)";
  }

  if (value.length <= 10) {
    return `${value.slice(0, 1)}***${value.slice(-1)}`;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export default function PublicEnvDebugPage() {
  const origin = typeof window === "undefined" ? "(unavailable)" : window.location.origin;
  const host = typeof document === "undefined" ? "(unavailable)" : document.location.host;

  const values: Array<[string, string]> = [
    ["window.location.origin", origin],
    ["document.location.host", host],
    ["NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(missing)"],
    [
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      maskAnonKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    ],
    ["NEXT_PUBLIC_API_BASE_URL", process.env.NEXT_PUBLIC_API_BASE_URL ?? "(missing)"],
    ["VERCEL_ENV", process.env.VERCEL_ENV ?? "(missing)"],
    ["NEXT_PUBLIC_VERCEL_ENV", process.env.NEXT_PUBLIC_VERCEL_ENV ?? "(missing)"],
  ];

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6 text-sm text-gray-900">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Public Environment Debug</h1>
        <p className="text-gray-700">
          This page is intentionally public so we can validate which NEXT_PUBLIC values were inlined
          into the client build.
        </p>
      </header>

      <div className="overflow-x-auto rounded-lg border border-gray-300 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="divide-y divide-gray-200">
            {values.map(([key, value]) => (
              <tr key={key}>
                <th className="w-72 px-4 py-3 text-left font-medium">{key}</th>
                <td className="px-4 py-3 font-mono text-xs">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
