"use client";

import { FeatureGuard } from "../../../_components/feature-guard";

export default function ReportPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <FeatureGuard feature="report">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Report {id}</h1>
        <p className="text-gray-400">Report details for this analysis are being prepared.</p>
      </div>
    </FeatureGuard>
  );
}
