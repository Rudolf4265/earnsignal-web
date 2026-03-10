"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppGate } from "../_components/app-gate-provider";
import { ActionCardsSection } from "./_components/dashboard/ActionCardsSection";
import { CreatorHealthPanel } from "./_components/dashboard/CreatorHealthPanel";
import { InsightCardsSection } from "./_components/dashboard/InsightCardsSection";
import { RevenueSnapshotSection } from "./_components/dashboard/RevenueSnapshotSection";
import { RevenueTrendSection } from "./_components/dashboard/RevenueTrendSection";
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
  const workspaceReadiness = `${state.latestUpload ? "Uploads detected" : "No uploads yet"} - ${
    state.hasReports === true
      ? "Reports available"
      : state.hasReports === false
        ? "No reports yet"
        : "Checking reports..."
  }`;

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

      <CreatorHealthPanel
        entitled={entitled}
        planTier={planTier}
        planStatusLabel={toBadgeLabel(planStatus)}
        planStatusVariant={toPlanBadgeVariant(planStatus, entitled)}
        loading={state.loading}
        workspaceReadiness={workspaceReadiness}
        reportsCheckError={state.reportsCheckError}
        platformsConnectedLabel={platformsConnected > 0 ? String(platformsConnected) : "None"}
        coverageLabel={kpis.coverageMonths !== null ? `${formatNumber(kpis.coverageMonths)} months` : "-- months"}
        lastUploadLabel={formatDate(state.latestUpload?.updatedAt ?? state.latestReport?.createdAt)}
        latestReportRow={state.latestReportRow}
        latestReportHref={latestReportHref}
        latestReportStatusLabel={toBadgeLabel(state.latestReportRow?.status ?? "unknown")}
        latestReportStatusVariant={toBadgeVariant(state.latestReportRow?.status ?? "unknown")}
        ctaLabel={primaryCta.label}
        ctaHref={primaryCta.href}
      />

      <RevenueSnapshotSection
        netRevenue={formatCurrency(kpis.netRevenue)}
        subscribers={formatNumber(kpis.subscribers)}
        stabilityIndex={formatNumber(kpis.stabilityIndex)}
        churnVelocity={formatNumber(kpis.churnVelocity)}
      />

      <InsightCardsSection insights={keySignals} />

      <ActionCardsSection actions={recommendedActions} />

      <RevenueTrendSection trendPreview={trendPreview} ctaLabel={primaryCta.label} ctaHref={primaryCta.href} />
    </div>
  );
}
