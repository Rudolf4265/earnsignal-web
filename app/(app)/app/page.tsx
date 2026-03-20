"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppGate } from "../_components/app-gate-provider";
import { useEntitlementState } from "../_components/use-entitlement-state";
import { ActionCardsSection } from "./_components/dashboard/ActionCardsSection";
import { CreatorHealthPanel } from "./_components/dashboard/CreatorHealthPanel";
import { DashboardMetricStrip } from "./_components/dashboard/DashboardMetricStrip";
import { DashboardOnboardingSection } from "./_components/dashboard/DashboardOnboardingSection";
import { DashboardTopShell } from "./_components/dashboard/DashboardTopShell";
import { DashboardUtilitySection } from "./_components/dashboard/DashboardUtilitySection";
import { GrowDashboardSection } from "./_components/dashboard/GrowDashboardSection";
import { InsightCardsSection } from "./_components/dashboard/InsightCardsSection";
import { RevenueTrendSection } from "./_components/dashboard/RevenueTrendSection";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { isApiError } from "@/src/lib/api/client";
import { fetchReportArtifactJson, fetchReportDetail, fetchReportsList, type ReportDetail, type ReportListResult } from "@/src/lib/api/reports";
import { decideDashboardPrimaryCta } from "@/src/lib/dashboard/primary-cta";
import { hydrateDashboardFromArtifact, type DashboardArtifactHydrationResult } from "@/src/lib/dashboard/artifact-hydration";
import { findFirstCompletedReport, loadLatestDashboardReport } from "@/src/lib/dashboard/latest-report";
import { buildDashboardInsights } from "@/src/lib/dashboard/insights";
import { buildDashboardDiagnosisViewModel } from "@/src/lib/dashboard/diagnosis";
import { buildDashboardActionCardsViewModel } from "@/src/lib/dashboard/action-cards";
import { buildDashboardRevenueTrendViewModel } from "@/src/lib/dashboard/revenue-trend";
import { buildEarnDashboardModel } from "@/src/lib/dashboard/earn-model";
import { adaptGrowDashboardSource } from "@/src/lib/dashboard/grow-adapter";
import { buildGrowDashboardModel } from "@/src/lib/dashboard/grow-model";
import { buildDashboardModeSearch, parseDashboardMode } from "@/src/lib/dashboard/mode";
import { formatReportArtifactContractErrors } from "@/src/lib/report/artifact-contract";
import { getLatestUploadStatus } from "@/src/lib/api/upload";
import { mapUploadStatus, type UploadStatusView } from "@/src/lib/upload/status";
import { computeHasReportsFromListResult } from "@/src/lib/report/list-model";
import { buildReportDetailPathOrIndex } from "@/src/lib/report/path";

const fallbackProActions = [
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
  const { state: gateState, entitlements, isLoading: authLoading } = useAppGate();
  const entitlementState = useEntitlementState();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<DashboardState>(() => getInitialDashboardState());
  const [refreshNonce, setRefreshNonce] = useState(0);
  const latestReportHref = useMemo(() => buildReportDetailPathOrIndex(state.latestReportRow?.id), [state.latestReportRow?.id]);
  const dashboardMode = parseDashboardMode(searchParams.get("mode"));

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
    return values;
  }, [state.latestArtifact, state.latestReport]);

  const recommendedActions = useMemo(() => {
    const values = state.latestArtifact?.recommendedActions.length
      ? state.latestArtifact.recommendedActions
      : (state.latestReport?.recommendedActions ?? []);
    return values.length > 0 ? values : fallbackProActions;
  }, [state.latestArtifact, state.latestReport]);

  const trendPreview = useMemo(
    () => state.latestArtifact?.trendPreview ?? state.latestReport?.summary ?? null,
    [state.latestArtifact, state.latestReport],
  );
  const revenueTrend = useMemo(
    () =>
      buildDashboardRevenueTrendViewModel({
        points: state.latestArtifact?.revenueTrend,
      }),
    [state.latestArtifact],
  );

  const planTier = entitlementState.effectivePlanTier;
  const planStatus = entitlements?.status ?? "inactive";
  const entitled = entitlementState.accessGranted;

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
    churnVelocity: artifactKpis?.churnVelocity ?? null,
    coverageMonths: reportMetrics?.coverageMonths ?? null,
    platformsConnected: reportMetrics?.platformsConnected ?? null,
  };

  const earnDashboardModel = useMemo(
    () =>
      buildEarnDashboardModel({
        kpis: {
          netRevenue: kpis.netRevenue,
          subscribers: kpis.subscribers,
          stabilityIndex: kpis.stabilityIndex,
        },
        stability: state.latestArtifact?.model?.stability ?? null,
        revenueDeltaText: state.latestArtifact?.revenueDeltaText ?? null,
        subscriberDeltaText: state.latestArtifact?.subscriberDeltaText ?? null,
      }),
    [
      kpis.netRevenue,
      kpis.stabilityIndex,
      kpis.subscribers,
      state.latestArtifact?.model?.stability,
      state.latestArtifact?.revenueDeltaText,
      state.latestArtifact?.subscriberDeltaText,
    ],
  );
  const growDashboardModel = useMemo(() => {
    const growSource = adaptGrowDashboardSource({
      latestArtifact: state.latestArtifact,
      latestReport: state.latestReport,
      latestUpload: state.latestUpload,
    });

    return growSource ? buildGrowDashboardModel(growSource) : null;
  }, [state.latestArtifact, state.latestReport, state.latestUpload]);

  const insightCards = useMemo(
    () =>
      buildDashboardInsights({
        keySignals,
        signals: state.latestArtifact?.model?.signals ?? [],
      }),
    [keySignals, state.latestArtifact?.model?.signals],
  );

  const diagnosisViewModel = useMemo(
    () =>
      buildDashboardDiagnosisViewModel({
        diagnosis: state.latestArtifact?.diagnosis ?? state.latestReport?.diagnosis ?? null,
        whatChanged: state.latestArtifact?.whatChanged ?? state.latestReport?.whatChanged ?? null,
        hasReport: state.latestReport !== null,
      }),
    [state.latestArtifact?.diagnosis, state.latestArtifact?.whatChanged, state.latestReport],
  );

  const actionCardsSection = useMemo(
    () =>
      buildDashboardActionCardsViewModel({
        gateState,
        entitlements,
        recommendedActions,
        recommendationItems: state.latestArtifact?.model?.recommendations ?? [],
        diagnosis: state.latestArtifact?.diagnosis ?? state.latestReport?.diagnosis ?? null,
        whatChanged: state.latestArtifact?.whatChanged ?? state.latestReport?.whatChanged ?? null,
        fallbackActions: fallbackProActions,
      }),
    [
      entitlements,
      gateState,
      recommendedActions,
      state.latestArtifact?.diagnosis,
      state.latestArtifact?.model?.recommendations,
      state.latestArtifact?.whatChanged,
      state.latestReport,
    ],
  );

  const platformsConnected = kpis.platformsConnected ?? (state.latestUpload ? 1 : 0);
  const growGuidanceLimited =
    dashboardMode === "grow" && (!growDashboardModel || growDashboardModel.availability !== "structured" || !growDashboardModel.creatorScore);
  const showDashboardOnboarding = state.hasReports !== true || growGuidanceLimited;
  const workspaceReadiness = state.latestUpload
    ? state.hasReports === true
      ? "Uploads are connected and at least one report is ready."
      : state.hasReports === false
        ? "Your upload is connected. Generate the first report to unlock measured dashboard detail."
        : "Your upload is connected. Checking the latest report availability."
    : state.hasReports === true
      ? "Reports are available from earlier uploads. Add a fresh supported upload when you want to refresh the workspace."
      : state.hasReports === false
        ? "This workspace is still empty. Upload a supported file to populate Earn."
        : "Checking workspace data availability.";
  const workspaceStatusLabel = state.latestUpload
    ? state.hasReports === true ? "Ready" : state.hasReports === false ? "Upload connected" : "Checking..."
    : state.hasReports === true ? "Reports available" : state.hasReports === false ? "No data yet" : "Checking...";
  const handleModeChange = useCallback(
    (nextMode: "earn" | "grow") => {
      const query = buildDashboardModeSearch(searchParams, nextMode);
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="space-y-5">
      <DashboardTopShell
        mode={dashboardMode}
        onModeChange={handleModeChange}
        refreshing={state.refreshing}
        refreshDisabled={state.loading || state.refreshing}
        onRefresh={refresh}
        primaryCtaLabel={primaryCta.label}
        primaryCtaHref={primaryCta.href}
      />

      {state.error || state.latestArtifactError ? (
        <div className="space-y-3">
          {state.error ? <ErrorBanner title="Data refresh failed" message={state.error} /> : null}
          {state.latestArtifactError ? <ErrorBanner title="Latest report artifact mismatch" message={state.latestArtifactError} /> : null}
        </div>
      ) : null}

      {showDashboardOnboarding ? (
        <DashboardOnboardingSection
          mode={dashboardMode}
          hasUpload={state.latestUpload !== null}
          hasReports={state.hasReports}
          growGuidanceLimited={growGuidanceLimited}
          ctaLabel={primaryCta.label}
          ctaHref={primaryCta.href}
        />
      ) : null}

      {dashboardMode === "earn" ? (
        <>
          {/* Top executive summary: rows 1–3 grouped tighter */}
          <div className="space-y-4">
            {/* Row 1: Primary Health (left) + Signals Worth Watching (right) */}
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
              <CreatorHealthPanel
                creatorHealth={earnDashboardModel.creatorHealth}
                loading={state.loading}
                latestReportRow={state.latestReportRow}
                latestReportHref={latestReportHref}
                latestReportStatusLabel={toBadgeLabel(state.latestReportRow?.status ?? "unknown")}
                latestReportStatusVariant={toBadgeVariant(state.latestReportRow?.status ?? "unknown")}
                diagnosisNotice={diagnosisViewModel.notice}
              />

              <InsightCardsSection insights={insightCards} diagnosis={diagnosisViewModel} loading={state.loading} />
            </div>

            {/* Row 2: Compact metric strip */}
            <DashboardMetricStrip
              revenueSnapshot={earnDashboardModel.revenueSnapshot}
              churnVelocity={kpis.churnVelocity}
              coverageMonths={kpis.coverageMonths}
            />

            {/* Row 3: Next Best Move */}
            <ActionCardsSection mode={actionCardsSection.mode} cards={actionCardsSection.cards} presentation="hero" />
          </div>

          <RevenueTrendSection
            trend={revenueTrend}
            trendPreview={trendPreview}
            loading={state.loading}
            ctaLabel={primaryCta.label}
            ctaHref={primaryCta.href}
          />

          <DashboardUtilitySection
            entitled={entitled}
            planTier={planTier}
            planStatusLabel={toBadgeLabel(planStatus)}
            planStatusVariant={toPlanBadgeVariant(planStatus, entitled)}
            loading={state.loading}
            workspaceReadiness={workspaceReadiness}
            reportsCheckError={state.reportsCheckError}
            platformsConnectedLabel={platformsConnected > 0 ? `${formatNumber(platformsConnected)} connected` : "No connected platforms yet"}
            coverageLabel={kpis.coverageMonths !== null ? `${formatNumber(kpis.coverageMonths)} months` : "Coverage appears after reporting starts"}
            lastUploadLabel={formatDate(state.latestUpload?.updatedAt ?? state.latestReport?.createdAt)}
            latestReportRow={state.latestReportRow}
            latestReportHref={latestReportHref}
            latestReportStatusLabel={toBadgeLabel(state.latestReportRow?.status ?? "unknown")}
            latestReportStatusVariant={toBadgeVariant(state.latestReportRow?.status ?? "unknown")}
            ctaLabel={primaryCta.label}
            ctaHref={primaryCta.href}
          />
        </>
      ) : (
        <>
          <GrowDashboardSection
            model={growDashboardModel}
            loading={state.loading}
            actionMode={actionCardsSection.mode}
            ctaLabel={primaryCta.label}
            ctaHref={primaryCta.href}
          />

          <DashboardUtilitySection
            entitled={entitled}
            planTier={planTier}
            planStatusLabel={toBadgeLabel(planStatus)}
            planStatusVariant={toPlanBadgeVariant(planStatus, entitled)}
            loading={state.loading}
            workspaceReadiness={workspaceReadiness}
            reportsCheckError={state.reportsCheckError}
            platformsConnectedLabel={platformsConnected > 0 ? `${formatNumber(platformsConnected)} connected` : "No connected platforms yet"}
            coverageLabel={kpis.coverageMonths !== null ? `${formatNumber(kpis.coverageMonths)} months` : "Coverage appears after reporting starts"}
            lastUploadLabel={formatDate(state.latestUpload?.updatedAt ?? state.latestReport?.createdAt)}
            latestReportRow={state.latestReportRow}
            latestReportHref={latestReportHref}
            latestReportStatusLabel={toBadgeLabel(state.latestReportRow?.status ?? "unknown")}
            latestReportStatusVariant={toBadgeVariant(state.latestReportRow?.status ?? "unknown")}
            ctaLabel={primaryCta.label}
            ctaHref={primaryCta.href}
          />
        </>
      )}
    </div>
  );
}
