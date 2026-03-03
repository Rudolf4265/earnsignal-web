"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useAppGate } from "@/app/(app)/_components/app-gate-provider";
import { DEBUG_LAUNCH_GATE_ROUTE } from "@/src/lib/debug/routes";

const healthChecks = [
  { label: "Liveness", href: "/livez" },
  { label: "Readiness", href: "/readyz" },
];

const uploadGoldenPathSteps = [
  {
    step: "1) Request presign",
    command:
      "POST /v1/uploads/presign with platform, filename, content_type, and size.",
    expected: "Returns 2xx and JSON with upload_id + presigned_url.",
  },
  {
    step: "2) Upload file bytes",
    command: "PUT file bytes to presigned_url using returned headers.",
    expected: "Storage returns 200/204.",
  },
  {
    step: "3) Finalize callback",
    command:
      "POST /v1/uploads/callback with upload_id, callback_proof, metadata, and success=true.",
    expected: "Returns 2xx and accepted/processing status.",
  },
  {
    step: "4) Poll upload status",
    command: "GET /v1/uploads/:upload_id/status until terminal state.",
    expected: "status becomes ready (or failed with reason_code).",
  },
  {
    step: "5) Generate report",
    command: "POST /v1/reports/generate with upload_id + platform.",
    expected: "Returns 2xx and report_id.",
  },
];

const curlPack = `# Required
export API_BASE_URL=\"https://api.example.com\"
export TOKEN=\"<supabase-or-api-bearer-token>\"
export UPLOAD_ID=\"<upload_id_from_presign>\"
export CALLBACK_PROOF='{"proof":"replace-with-real-proof"}'

# 1) presign
curl -i -X POST "$API_BASE_URL/v1/uploads/presign" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  --data '{"platform":"youtube","filename":"launch-gate.csv","content_type":"text/csv","size":128}'

# 2) callback
curl -i -X POST "$API_BASE_URL/v1/uploads/callback" \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  --data "{\"upload_id\":\"$UPLOAD_ID\",\"success\":true,\"size_bytes\":128,\"platform\":\"youtube\",\"filename\":\"launch-gate.csv\",\"content_type\":\"text/csv\",\"callback_proof\":$CALLBACK_PROOF}"

# 3) explicit upload status
curl -i "$API_BASE_URL/v1/uploads/$UPLOAD_ID/status" \\
  -H "Authorization: Bearer $TOKEN"

# 4) latest upload status
curl -i "$API_BASE_URL/v1/uploads/latest/status" \\
  -H "Authorization: Bearer $TOKEN"`;

export default function LaunchGateDebugPage() {
  const { isAdmin } = useAppGate();
  if (!DEBUG_LAUNCH_GATE_ROUTE) {
    notFound();
  }

  if (!isAdmin) {
    return <p className="text-sm text-gray-300">Not available to non-admins.</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">Launch Gate checklist</h1>
        <p className="text-sm text-gray-400">
          Internal pre-merge checks for upload golden path stability.
        </p>
      </header>

      <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-medium text-white">API health probes</h2>
        <ul className="space-y-2 text-sm">
          {healthChecks.map((item) => (
            <li
              key={item.href}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2"
            >
              <span className="text-gray-100">{item.label}</span>
              <Link href={item.href} className="text-brand-blue hover:underline">
                Open
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-medium text-white">Upload golden path</h2>
        <ol className="space-y-2 text-sm text-gray-200">
          {uploadGoldenPathSteps.map((item) => (
            <li key={item.step} className="rounded-lg border border-white/5 bg-black/20 px-3 py-3">
              <p className="font-medium text-white">{item.step}</p>
              <p className="text-gray-300">{item.command}</p>
              <p className="text-gray-400">Expected: {item.expected}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-medium text-white">Copy/paste curl pack</h2>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-gray-100">
          <code>{curlPack}</code>
        </pre>
      </section>
    </div>
  );
}
