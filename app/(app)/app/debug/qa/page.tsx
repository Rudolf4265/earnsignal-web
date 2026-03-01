"use client";

import Link from "next/link";
import { useAppGate } from "@/app/(app)/_components/app-gate-provider";

const checks = [
  { label: "Auth: login", href: "/login" },
  { label: "Dashboard", href: "/app" },
  { label: "Upload flow", href: "/app/data" },
  { label: "Reports list", href: "/app/report" },
  { label: "Billing", href: "/app/billing" },
  { label: "Admin console", href: "/app/admin" },
  { label: "Env debug", href: "/app/debug/env" },
];

export default function QaDebugPage() {
  const { isAdmin } = useAppGate();
  const isProd = process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

  if (isProd && !isAdmin) {
    return <p className="text-sm text-gray-300">Not available in production.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">Internal QA checklist</h1>
        <p className="text-sm text-gray-400">Use these quick links to verify launch-critical flows before release.</p>
      </header>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <ul className="space-y-2 text-sm">
          {checks.map((item) => (
            <li key={item.href} className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-black/20 px-3 py-2">
              <span className="text-gray-100">{item.label}</span>
              <Link href={item.href} className="text-brand-blue hover:underline">
                Open
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
