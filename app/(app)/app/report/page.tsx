"use client";

import Link from "next/link";
import { FeatureGuard } from "../../_components/feature-guard";

export default function ReportsPage() {
  return (
    <FeatureGuard feature="report">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <p className="text-slate-600">Choose a report to review analysis details.</p>
        <Link href="/app/report/demo" className="inline-block rounded-lg border border-slate-200 bg-white px-4 py-2 transition hover:bg-slate-100">
          Open sample report
        </Link>
      </div>
    </FeatureGuard>
  );
}
