"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "./_components/dashboard/Badge";
import { EmptyState } from "./_components/dashboard/EmptyState";
import { KpiCard } from "./_components/dashboard/KpiCard";
import { Panel } from "./_components/dashboard/Panel";
import { useAppGate } from "../_components/app-gate-provider";
import { SkeletonBlock } from "../_components/ui/skeleton";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { Button, buttonClassName } from "@/src/components/ui/button";
import { PageHeader } from "@/src/components/ui/page-header";
import { isApiError } from "@/src/lib/api/client";
import { fetchReportArtifactJson, fetchReportDetail, fetchReportsList, type ReportDetail, type ReportListResult } from "@/src/lib/api/reports";
import { decideDashboardPrimaryCta } from "@/src/lib/dashboard/primary-cta";
import { hydrateDashboardFromArtifact, type DashboardArtifactHydrationResult } from "@/src/lib/dashboard/artifact-hydration";
import { findFirstCompletedReport, loadLatestDashboardReport } from "@/src/lib/dashboard/latest-report";
import { formatReportArtifactContractErrors } from "@/src/lib/report/artifact-contract";
import { getLatestUploadStatus } from "@/src/lib/api/upload";
import { mapUploadStatus, type UploadStatusView } from "@/src/lib/upload/status";
import { computeHasReportsFromListResult } from "@/src/lib/report/list-model";
import { buildReportDetailPathOrIndex } from "@/src/lib/report/path";

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

type LatestReportRow = {
  id: string;
  date: string;
  status: string;
};

type DashboardState = {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  latestArtifactError: string | null;
  reportsCheckError: string | null;
  latestUpload: UploadStatusView | null;
  latestReport: ReportDetail | null;
  latestArtifact: DashboardArtifactHydrationResult | null;
  latestReportRow: LatestReportRow | null;
  hasReports: boolean | null;
};

const initialState: DashboardState = {
  loading: true,
  refreshing: false,
  error: null,
  latestArtifactError: null,
  reportsCheckError: null,
  latestUpload: null,
  latestReport: null,
  latestArtifact: null,
  latestReportRow: null,
  hasReports: null,
};

type DashboardLoadResult = Omit<DashboardState, "loading" | "refreshing" | "error">;
type DashboardLastKnownGood = Pick<
  DashboardState,
  "latestArtifactError" | "latestUpload" | "latestReport" | "latestArtifact" | "latestReportRow" | "hasReports"
>;

let lastKnownGoodDashboardState: DashboardLastKnownGood | null = null;
let dashboardLoadInFlight: Promise<DashboardLoadResult> | null = null;

function hasRenderableDashboardState(state: Pick<DashboardState, "latestUpload" | "latestReport" | "latestArtifact" | "latestReportRow" | "hasReports">): boolean {
  return state.latestUpload !== null || state.latestReport !== null || state.latestArtifact !== null || state.latestReportRow !== null || state.hasReports !== null;
}

function canPersistDashboardResult(result: DashboardLoadResult): boolean {
  return hasRenderableDashboardState(result);
}

function buildLatestReportRow(report: ReportDetail): LatestReportRow {
  return {
    id: report.id,
    date: formatDate(report.createdAt),
    status: report.status || "unknown",
  };
}

function getInitialDashboardState(): DashboardState {
  if (!lastKnownGoodDashboardState) {
    return initialState;
  }

  return {
    ...initialState,
    loading: false,
    ...lastKnownGoodDashboardState,
  };
}

async function loadDashboardData(options?: { forceRefresh?: boolean }): Promise<DashboardLoadResult> {
  const forceRefresh = options?.forceRefresh ?? false;
  if (!forceRefresh && dashboardLoadInFlight) {
    return dashboardLoadInFlight;
  }

  const loadPromise = (async () => {
    let latestUpload: UploadStatusView | null = null;
    try {
      const uploadPayload = await getLatestUploadStatus({ forceRefresh });
      latestUpload = mapUploadStatus(uploadPayload);
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        // Ignore missing latest upload and continue list-based hydration.
      } else if (process.env.NODE_ENV !== "production") {
        console.warn("[dashboard] latest upload status unavailable; continuing with reports list hydration.", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    let reports: ReportListResult | null = null;
    let reportsCheckError: string | null = null;
    try {
      reports = await fetchReportsList(null, { forceRefresh });
    } catch {
      reportsCheckError = "Unable to verify report availability right now.";
    }

    const latestReport = await loadLatestDashboardReport({
      latestUploadReportId: latestUpload?.reportId ?? null,
      fetchReportDetail,
      fetchReportsList: () => fetchReportsList(null, { forceRefresh }),
      reportsList: reports,
    });

    let latestArtifact: DashboardArtifactHydrationResult | null = null;
    let latestArtifactError: string | null = null;
    if (latestReport?.artifactJsonUrl) {
      try {
        const artifactRaw = await fetchReportArtifactJson(latestReport.artifactJsonUrl);
        latestArtifact = hydrateDashboardFromArtifact(artifactRaw);
        if (!latestArtifact.contractValid) {
          latestArtifactError = formatReportArtifactContractErrors(latestArtifact.contractErrors);
        }
      } catch (artifactError) {
        latestArtifactError = artifactError instanceof Error ? artifactError.message : "Unable to load latest report artifact.";
      }
    }

    const firstCompletedReport = reports ? findFirstCompletedReport(reports.items) : null;
    const latestReportRow =
      latestReport ? buildLatestReportRow(latestReport) : firstCompletedReport?.reportId
        ? {
            id: firstCompletedReport.reportId,
            date: formatDate(firstCompletedReport.createdAt),
            status: firstCompletedReport.status || "unknown",
          }
        : null;

    const hasReports = reports ? computeHasReportsFromListResult(reports) : latestReport ? true : null;

    return {
      latestArtifactError,
      reportsCheckError,
      latestUpload,
      latestReport,
      latestArtifact,
      latestReportRow,
      hasReports,
    };
  })();

  if (!forceRefresh) {
    dashboardLoadInFlight = loadPromise;
  }

  try {
    const result = await loadPromise;
    if (canPersistDashboardResult(result)) {
      lastKnownGoodDashboardState = {
        latestArtifactError: result.latestArtifactError,
        latestUpload: result.latestUpload,
        latestReport: result.latestReport,
        latestArtifact: result.latestArtifact,
        latestReportRow: result.latestReportRow,
        hasReports: result.hasReports,
      };
    }
    return result;
  } finally {
    if (dashboardLoadInFlight === loadPromise) {
      dashboardLoadInFlight = null;
    }
  }
}

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

  if (!status.trim()) {
    return "Unknown";
  }

  return status
    .split(/[_\s-]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function toPlanBadgeVariant(status: string | null, entitled: boolean): "good" | "warn" | "neutral" {
  const normalized = (status ?? "").toLowerCase();
  if (entitled && (normalized === "active" || normalized === "trialing")) {
    return "good";
  }

  if (!entitled || ["inactive", "past_due", "canceled", "cancelled", "incomplete", "unpaid"].includes(normalized)) {
    return "warn";
  }

  return "neutral";
}

export default function DashboardPage() {
  const { entitlements, isLoading: authLoading } = useAppGate();
  const [state, setState] = useState<DashboardState>(() => getInitialDashboardState());
  const [refreshNonce, setRefreshNonce] = useState(0);
  const latestReportHref = useMemo(() => buildReportDetailPathOrIndex(state.latestReportRow?.id), [state.latestReportRow?.id]);

  useEffect(() => {
    let cancelled = false;

    if (authLoading) {
      return () => {
        cancelled = true;
      };
    }

    async function load() {
      setState((prev) => ({
        ...prev,
        loading: refreshNonce === 0 && !hasRenderableDashboardState(prev),
        refreshing: refreshNonce > 0,
        error: null,
      }));

      try {
        const result = await loadDashboardData({ forceRefresh: refreshNonce > 0 });

        if (cancelled) {
          return;
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          refreshing: false,
          error: null,
          ...result,
        }));
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
  }, [authLoading, refreshNonce]);

  const refresh = useCallback(() => {
    setRefreshNonce((prev) => prev + 1);
  }, []);

  const keySignals = useMemo(() => {
    const values = state.latestArtifact?.keySignals.length ? state.latestArtifact.keySignals : (state.latestReport?.keySignals ?? []);
    return values.length > 0 ? values : fallbackSignals;
  }, [state.latestArtifact, state.latestReport]);

  const recommendedActions = useMemo(() => {
    const values = state.latestArtifact?.recommendedActions.length
      ? state.latestArtifact.recommendedActions
      : (state.latestReport?.recommendedActions ?? []);
    return values.length > 0 ? values : fallbackActions;
  }, [state.latestArtifact, state.latestReport]);

  const trendPreview = useMemo(
    () => state.latestArtifact?.trendPreview ?? state.latestReport?.summary ?? null,
    [state.latestArtifact, state.latestReport],
  );

  const planTier = entitlements?.plan ?? "None";
  const planStatus = entitlements?.status ?? "inactive";
  const entitled = entitlements?.entitled === true;

  const primaryCta = useMemo(
    () =>
      decideDashboardPrimaryCta({
        entitled,
        hasUploads: state.latestUpload !== null,
        hasReports: state.hasReports,
      }),
    [entitled, state.hasReports, state.latestUpload],
  );

  const reportMetrics = state.latestReport?.metrics;
  const artifactKpis = state.latestArtifact?.kpis;
  const kpis = {
    netRevenue: artifactKpis?.netRevenue ?? reportMetrics?.netRevenue ?? null,
    subscribers: artifactKpis?.subscribers ?? reportMetrics?.subscribers ?? null,
    stabilityIndex: artifactKpis?.stabilityIndex ?? reportMetrics?.stabilityIndex ?? null,
    churnVelocity: artifactKpis?.churnVelocity ?? reportMetrics?.churnVelocity ?? null,
    coverageMonths: reportMetrics?.coverageMonths ?? null,
    platformsConnected: reportMetrics?.platformsConnected ?? null,
  };

  const platformsConnected = kpis.platformsConnected ?? (state.latestUpload ? 1 : 0);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Dashboard"
        subtitle="High-level revenue signals and structural stability."
        actions={
          <>
            <Button type="button" variant="secondary" onClick={refresh} disabled={state.loading || state.refreshing}>
              {state.refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Link href={primaryCta.href} className={buttonClassName({ variant: "primary" })}>
              {primaryCta.label}
            </Link>
          </>
        }
      />

      {state.error ? <ErrorBanner title="Data refresh failed" message={state.error} /> : null}
      {state.latestArtifactError ? <ErrorBanner title="Latest report artifact mismatch" message={state.latestArtifactError} /> : null}

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
            {trendPreview ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {trendPreview}
              </p>
            ) : (
              <EmptyState
                title="Charts appear once data is connected"
                body="Upload revenue data to populate trend lines, variance windows, and seasonality insights."
                ctaLabel={primaryCta.label}
                ctaHref={primaryCta.href}
              />
            )}
          </Panel>
        </div>

        <div className="space-y-8">
          <Panel
            title="Plan & Status"
            rightSlot={
              !entitled ? (
                <Link
                  href="/app/billing"
                  className={buttonClassName({ variant: "secondary", size: "sm" })}
                >
                  Upgrade
                </Link>
              ) : undefined
            }
          >
            <dl className="space-y-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-600">Plan tier</dt>
                <dd className="mt-1 text-sm text-slate-900">{planTier}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-600">Status</dt>
                <dd className="mt-1">
                  <Badge variant={toPlanBadgeVariant(planStatus, entitled)}>{toBadgeLabel(planStatus)}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-600">Gated state</dt>
                <dd className="mt-1 text-sm text-slate-900">{entitled ? "Active" : "Upgrade required"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-600">Workspace readiness</dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {state.loading ? (
                    <div className="space-y-2 pt-1">
                      <SkeletonBlock className="h-3 w-32 bg-slate-200" />
                      <SkeletonBlock className="h-3 w-40 bg-slate-200" />
                    </div>
                  ) : (
                    `${state.latestUpload ? "Uploads detected" : "No uploads yet"} - ${
                      state.hasReports === true
                        ? "Reports available"
                        : state.hasReports === false
                          ? "No reports yet"
                          : "Checking reports..."
                    }`
                  )}
                </dd>
                {!state.loading && state.reportsCheckError ? (
                  <p className="mt-1 text-xs text-slate-500">{state.reportsCheckError}</p>
                ) : null}
              </div>
            </dl>
          </Panel>

          <Panel
            title="Data Status"
            rightSlot={
              <Link
                href={primaryCta.href}
                className={buttonClassName({ variant: "secondary", size: "sm" })}
              >
                {primaryCta.label}
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
            {state.latestReportRow ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm text-slate-900">{state.latestReportRow.date}</p>
                  </div>
                  <Badge variant={toBadgeVariant(state.latestReportRow.status)}>{toBadgeLabel(state.latestReportRow.status)}</Badge>
                  <Link
                    href={latestReportHref}
                    className={buttonClassName({ variant: "primary", size: "sm" })}
                  >
                    View
                  </Link>
                </div>
              </div>
            ) : (
              <EmptyState
                title={state.loading ? "Loading report data..." : "No reports generated yet."}
                body="Upload your data and generate analysis to see report quality and summaries here."
                ctaLabel={primaryCta.label}
                ctaHref={primaryCta.href}
              />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
