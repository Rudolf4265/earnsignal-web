"use client";

import Link from "next/link";
import { FeatureGuard } from "../../_components/feature-guard";

export default function ReportsPage() {
  return (
    <FeatureGuard feature="report">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-gray-400">Choose a report to review analysis details.</p>
        <Link href="/app/report/demo" className="inline-block rounded-lg bg-white/10 px-4 py-2 hover:bg-white/15 transition">
          Open sample report
        </Link>
      </div>
    </FeatureGuard>
  );
}
