"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FeatureGuard } from "../../_components/feature-guard";
import { isApiError } from "@/src/lib/api/client";
import { fetchReportDetail, type ReportDetail } from "@/src/lib/api/reports";
import { getLatestUploadStatus } from "@/src/lib/api/upload";
import { mapUploadStatus } from "@/src/lib/upload/status";

type ReportsState = {
  loading: boolean;
  error: string | null;
  reports: ReportDetail[];
};

const initialState: ReportsState = {
  loading: true,
  error: null,
  reports: [],
};

function formatDate(value?: string): string {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export default function ReportsPage() {
  const [state, setState] = useState<ReportsState>(initialState);

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      try {
        let report: ReportDetail | null = null;
        try {
          const latestUpload = await getLatestUploadStatus();
          const mapped = mapUploadStatus(latestUpload);
          if (mapped.reportId) {
            report = await fetchReportDetail(mapped.reportId);
          }
        } catch (error) {
          if (!(isApiError(error) && error.status === 404)) {
            throw error;
          }
        }

        if (cancelled) {
          return;
        }

        setState({
          loading: false,
          error: null,
          reports: report ? [report] : [],
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState({
          loading: false,
          error: error instanceof Error ? error.message : "Unable to load reports.",
          reports: [],
        });
      }
    }

    void loadReports();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <FeatureGuard feature="report">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <p className="text-slate-600">Choose a report to review analysis details.</p>
        {state.error ? <p className="text-sm text-rose-700">Report list unavailable: {state.error}</p> : null}

        {state.loading ? (
          <p className="text-sm text-slate-600">Loading reports...</p>
        ) : state.reports.length > 0 ? (
          <div className="space-y-2">
            {state.reports.map((report) => (
              <Link
                key={report.id}
                href={`/app/report/${report.id}`}
                className="block rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-100"
              >
                <p className="text-sm font-semibold text-slate-900">{report.title}</p>
                <p className="mt-1 text-xs text-slate-600">
                  {report.id} - {formatDate(report.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            No reports yet. Upload data to generate your first report.
          </div>
        )}
      </div>
    </FeatureGuard>
  );
}
