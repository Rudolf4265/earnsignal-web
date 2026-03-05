"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "./_components/dashboard/Badge";
import { EmptyState } from "./_components/dashboard/EmptyState";
import { KpiCard } from "./_components/dashboard/KpiCard";
import { Panel } from "./_components/dashboard/Panel";
import { isApiError } from "@/src/lib/api/client";
import { fetchReportDetail, type ReportDetail } from "@/src/lib/api/reports";
import { getLatestUploadStatus } from "@/src/lib/api/upload";
import { mapUploadStatus, type UploadStatusView } from "@/src/lib/upload/status";

const fallbackSignals = [
  "Revenue trend detection will appear after your first completed report.",
  "Concentration watch will identify over-reliance on a small customer set.",
  "Retention pressure will highlight cohorts with rising churn risk.",
];

const fallbackActions = [
  "Upload your latest exports to initialize baseline trend analysis.",
  "Reconnect source systems monthly to keep quality and confidence high.",
  "Review generated reports and share findings with finance and GTM leads.",
  "Track changes over time to verify whether actions improve net revenue.",
];

type DashboardState = {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  latestUpload: UploadStatusView | null;
  latestReport: ReportDetail | null;
};

const initialState: DashboardState = {
  loading: true,
  refreshing: false,
  error: null,
  latestUpload: null,
  latestReport: null,
};

function formatCurrency(value: number | null): string {
  if (value === null) {
    return "$--";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number | null): string {
  if (value === null) {
    return "--";
  }

  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatDate(value?: string | null): string {
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

function toBadgeVariant(status: string): "good" | "warn" | "neutral" {
  const normalized = status.toLowerCase();
  if (["ready", "completed", "complete", "success", "succeeded"].includes(normalized)) {
    return "good";
  }

  if (["failed", "error", "rejected", "validation_failed", "report_failed"].includes(normalized)) {
    return "warn";
  }

  return "neutral";
}

function toBadgeLabel(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === "ready") {
    return "Ready";
  }

  if (normalized === "processing") {
    return "Processing";
  }

  return status;
}

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState>(initialState);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((prev) => ({
        ...prev,
        loading: refreshNonce === 0,
        refreshing: refreshNonce > 0,
        error: null,
      }));

      try {
        let latestUpload: UploadStatusView | null = null;

        try {
          const uploadPayload = await getLatestUploadStatus();
          latestUpload = mapUploadStatus(uploadPayload);
        } catch (error) {
          if (!(isApiError(error) && error.status === 404)) {
            throw error;
          }
        }

        let latestReport: ReportDetail | null = null;
        const reportId = latestUpload?.reportId;
        if (reportId) {
          try {
            latestReport = await fetchReportDetail(reportId);
          } catch (error) {
            if (!(isApiError(error) && error.status === 404)) {
              throw error;
            }
          }
        }

        if (cancelled) {
          return;
        }

        setState({
          loading: false,
          refreshing: false,
          error: null,
          latestUpload,
          latestReport,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          refreshing: false,
          error: error instanceof Error ? error.message : "Unable to load dashboard data.",
        }));
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [refreshNonce]);

  const refresh = useCallback(() => {
    setRefreshNonce((prev) => prev + 1);
  }, []);

  const keySignals = useMemo(() => {
    const values = state.latestReport?.keySignals ?? [];
    return values.length > 0 ? values : fallbackSignals;
  }, [state.latestReport]);

  const recommendedActions = useMemo(() => {
    const values = state.latestReport?.recommendedActions ?? [];
    return values.length > 0 ? values : fallbackActions;
  }, [state.latestReport]);

  const latestReportRow = state.latestReport
    ? {
        id: state.latestReport.id,
        date: formatDate(state.latestReport.createdAt),
        status: state.latestReport.status || "unknown",
      }
    : null;

  const kpis = state.latestReport?.metrics ?? {
    netRevenue: null,
    subscribers: null,
    stabilityIndex: null,
    churnVelocity: null,
    coverageMonths: null,
    platformsConnected: null,
  };

  const platformsConnected = kpis.platformsConnected ?? (state.latestUpload ? 1 : 0);

  return (
    <div className="space-y-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-2 text-slate-600">High-level revenue signals and structural stability.</p>
          {state.error ? <p className="mt-2 text-sm text-rose-700">Data refresh failed: {state.error}</p> : null}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={state.loading || state.refreshing}
            className="inline-flex w-fit rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state.refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <Link
            href="/app/data"
            className="inline-flex w-fit rounded-xl bg-brand-blue px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Upload data
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Net Revenue" value={formatCurrency(kpis.netRevenue)} subtext="Last 30 days" />
        <KpiCard label="Subscribers" value={formatNumber(kpis.subscribers)} subtext="Current" />
        <KpiCard label="Stability Index" value={formatNumber(kpis.stabilityIndex)} subtext="Revenue concentration" />
        <KpiCard label="Churn Velocity" value={formatNumber(kpis.churnVelocity)} subtext="Monthly movement" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Panel title="Key Signals" description="AI-generated highlights from your latest completed report.">
            <ul className="divide-y divide-slate-200">
              {keySignals.map((signal) => (
                <li key={signal} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm text-slate-700">{signal}</p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Recommended Actions" description="Practical next steps based on your most recent analysis.">
            <ul className="divide-y divide-slate-200">
              {recommendedActions.map((action) => (
                <li key={action} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm text-slate-700">{action}</p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Trend Preview" description="Charts render automatically once enough historical data is available.">
            {state.latestReport ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {state.latestReport.summary}
              </p>
            ) : (
              <EmptyState
                title="Charts appear once data is connected"
                body="Upload revenue data to populate trend lines, variance windows, and seasonality insights."
                ctaLabel="Upload data"
                ctaHref="/app/data"
              />
            )}
          </Panel>
        </div>

        <div className="space-y-8">
          <Panel
            title="Data Status"
            rightSlot={
              <Link
                href="/app/data"
                className="inline-flex rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Upload data
              </Link>
            }
          >
            <dl className="space-y-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-600">Platforms connected</dt>
                <dd className="mt-1 text-sm text-slate-900">{platformsConnected > 0 ? String(platformsConnected) : "None"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-600">Coverage</dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {kpis.coverageMonths !== null ? `${formatNumber(kpis.coverageMonths)} months` : "-- months"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-600">Last upload</dt>
                <dd className="mt-1 text-sm text-slate-900">{formatDate(state.latestUpload?.updatedAt ?? state.latestReport?.createdAt)}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Recent Reports" description="Latest generated analyses and quality status.">
            {latestReportRow ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm text-slate-900">{latestReportRow.date}</p>
                  </div>
                  <Badge variant={toBadgeVariant(latestReportRow.status)}>{toBadgeLabel(latestReportRow.status)}</Badge>
                  <Link
                    href={`/app/report/${latestReportRow.id}`}
                    className="inline-flex rounded-xl border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    View
                  </Link>
                </div>
              </div>
            ) : (
              <EmptyState
                title={state.loading ? "Loading report data..." : "No reports generated yet."}
                body="Upload your data and generate analysis to see report quality and summaries here."
                ctaLabel="Upload data"
                ctaHref="/app/data"
              />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
