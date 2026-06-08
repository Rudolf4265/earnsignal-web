"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppGate } from "../../_components/app-gate-provider";
import { useEntitlementState } from "../../_components/use-entitlement-state";
import { DashboardHeader } from "../_components/dashboard/DashboardHeader";
import { DashboardKpiStrip } from "../_components/dashboard/DashboardKpiStrip";
import { DashboardOnboardingSection } from "../_components/dashboard/DashboardOnboardingSection";
import { DashboardWhatsHappening, type AudienceRow, type WhatsHappeningSignal } from "../_components/dashboard/DashboardWhatsHappening";
import { DashboardNextMoveSection } from "../_components/dashboard/DashboardNextMoveSection";
import { RevenueTrendSection } from "../_components/dashboard/RevenueTrendSection";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { isApiError } from "@/src/lib/api/client";
import {
  fetchGrowthReport,
  fetchReportArtifactJson,
  fetchReportDetail,
  fetchReportsList,
  type GrowthReport,
  type ReportDetail,
  type ReportListResult,
} from "@/src/lib/api/reports";
import { decideDashboardPrimaryCta } from "@/src/lib/dashboard/primary-cta";
import { hydrateDashboardFromArtifact, type DashboardArtifactHydrationResult } from "@/src/lib/dashboard/artifact-hydration";
import { findFirstCompletedReport, loadLatestDashboardReport } from "@/src/lib/dashboard/latest-report";
import { buildDashboardInsights } from "@/src/lib/dashboard/insights";
import { buildDashboardActionCardsViewModel } from "@/src/lib/dashboard/action-cards";
import { buildDashboardRevenueTrendViewModel } from "@/src/lib/dashboard/revenue-trend";
import { buildEarnDashboardModel } from "@/src/lib/dashboard/earn-model";
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
  growthReport: GrowthReport | null;
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
  growthReport: null,
};

type DashboardLoadResult = Omit<DashboardState, "loading" | "refreshing" | "error">;
type DashboardLastKnownGood = Pick<
  DashboardState,
  "latestArtifactError" | "latestUpload" | "latestReport" | "latestArtifact" | "latestReportRow" | "hasReports" | "growthReport"
>;

let lastKnownGoodDashboardState: DashboardLastKnownGood | null = null;
let dashboardLoadInFlight: Promise<DashboardLoadResult> | null = null;

function hasRenderableDashboardState(
  state: Pick<DashboardState, "latestUpload" | "latestReport" | "latestArtifact" | "latestReportRow" | "hasReports">,
): boolean {
  return (
    state.latestUpload !== null ||
    state.latestReport !== null ||
    state.latestArtifact !== null ||
    state.latestReportRow !== null ||
    state.hasReports !== null
  );
}

function canPersistDashboardResult(result: DashboardLoadResult): boolean {
  return hasRenderableDashboardState(result) || result.growthReport !== null;
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
        latestArtifactError =
          artifactError instanceof Error ? artifactError.message : "Unable to load latest report artifact.";
      }
    }

    const firstCompletedReport = reports ? findFirstCompletedReport(reports.items) : null;
    const latestReportRow =
      latestReport
        ? buildLatestReportRow(latestReport)
        : firstCompletedReport?.reportId
          ? {
              id: firstCompletedReport.reportId,
              date: formatDate(firstCompletedReport.createdAt),
              status: firstCompletedReport.status || "unknown",
            }
          : null;

    const hasReports = reports ? computeHasReportsFromListResult(reports) : latestReport ? true : null;

    let growthReport: GrowthReport | null = null;
    try {
      growthReport = await fetchGrowthReport();
    } catch {
      // Non-critical: growth report unavailability does not block the dashboard.
    }

    return {
      latestArtifactError,
      reportsCheckError,
      latestUpload,
      latestReport,
      latestArtifact,
      latestReportRow,
      hasReports,
      growthReport,
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
        growthReport: result.growthReport,
      };
    }
    return result;
  } finally {
    if (dashboardLoadInFlight === loadPromise) {
      dashboardLoadInFlight = null;
    }
  }
}

function formatDate(value?: string | null, fallback = "Not available"): string {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function toInsightTone(variant: "positive" | "warning" | "neutral"): WhatsHappeningSignal["tone"] {
  if (variant === "positive") return "positive";
  if (variant === "warning") return "warning";
  return "neutral";
}

export default function DashboardPage() {
  const { state: gateState, entitlements, isLoading: authLoading } = useAppGate();
  const entitlementState = useEntitlementState();
  const [state, setState] = useState<DashboardState>(() => getInitialDashboardState());
  const [refreshNonce, setRefreshNonce] = useState(0);

  const latestReportHref = useMemo(
    () => buildReportDetailPathOrIndex(state.latestReportRow?.id),
    [state.latestReportRow?.id],
  );

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

  // ── Derived values ──────────────────────────────────────────────────────────

  const keySignals = useMemo(() => {
    const values = state.latestArtifact?.keySignals.length
      ? state.latestArtifact.keySignals
      : (state.latestReport?.keySignals ?? []);
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

  const entitled = entitlementState.accessGranted;
  const hasProDashboardTreatment = entitlementState.hasProAccess || entitlementState.isFounder;
  const showReportSnapshotBanner =
    entitled && !hasProDashboardTreatment && entitlementState.effectivePlanTier === "report";

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

  const insightCards = useMemo(
    () =>
      buildDashboardInsights({
        keySignals,
        signals: state.latestArtifact?.model?.signals ?? [],
      }),
    [keySignals, state.latestArtifact?.model?.signals],
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

  const whatsHappeningSignals = useMemo<WhatsHappeningSignal[]>(
    () =>
      insightCards.slice(0, 3).map((insight) => ({
        id: insight.id,
        tone: toInsightTone(insight.variant),
        title: insight.title,
        body: insight.body,
      })),
    [insightCards],
  );

  const audienceRows = useMemo<AudienceRow[]>(() => {
    const rows: AudienceRow[] = [];
    const signals = state.growthReport?.audience_signals as
      | Record<string, Array<{ followers_gained?: number; month?: string }>>
      | undefined;
    if (!signals) return rows;

    const platforms: Array<{ key: string; label: string }> = [
      { key: "instagram", label: "Instagram" },
      { key: "tiktok", label: "TikTok" },
      { key: "youtube", label: "YouTube" },
    ];

    for (const { key, label } of platforms) {
      const arr = signals[key];
      if (!arr?.length) continue;
      const last = arr.at(-1);
      if (!last || last.followers_gained == null) continue;
      rows.push({
        platform: label,
        followersGained: last.followers_gained,
        period: last.month ?? "",
      });
      if (rows.length >= 2) break;
    }

    return rows;
  }, [state.growthReport]);

  // ── Header / UI values ──────────────────────────────────────────────────────

  const showDashboardOnboarding = state.hasReports !== true;

  const dashboardSnapshotLabel = state.latestReportRow
    ? `Latest snapshot: ${state.latestReportRow.date}.`
    : state.loading
      ? "Loading your latest dashboard snapshot."
      : "Run a report to unlock your latest dashboard snapshot.";

  const dashboardHeaderNote =
    state.latestReport?.snapshotCoverageNote ??
    (state.latestReport?.reportHasBusinessMetrics === false
      ? "Your latest report does not include strong business metrics. Connect a revenue or subscriber source to strengthen earnings analysis."
      : null);

  const dashboardPlanBadgeLabel = hasProDashboardTreatment ? "Pro" : null;

  const dashboardTierBanner = showReportSnapshotBanner
    ? {
        variant: "snapshot" as const,
        eyebrow: "Snapshot companion",
        body: "This dashboard reflects your purchased report snapshot. Upgrade to Pro for ongoing intelligence, comparisons, and monitoring.",
        testId: "dashboard-report-snapshot-banner",
      }
    : null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <DashboardHeader
        snapshotLabel={dashboardSnapshotLabel}
        note={dashboardHeaderNote}
        planBadgeLabel={dashboardPlanBadgeLabel}
        tierBanner={dashboardTierBanner}
        latestReportHref={latestReportHref}
        refreshing={state.refreshing}
        refreshDisabled={state.loading || state.refreshing}
        onRefresh={refresh}
      />

      {(state.error || state.latestArtifactError) && (
        <div className="space-y-3">
          {state.error ? <ErrorBanner title="Data refresh failed" message={state.error} /> : null}
          {state.latestArtifactError ? (
            <ErrorBanner title="Latest report artifact mismatch" message={state.latestArtifactError} />
          ) : null}
        </div>
      )}

      {/* Strip 1 — KPI cards */}
      <DashboardKpiStrip
        netRevenue={kpis.netRevenue}
        subscribers={kpis.subscribers}
        earnScore={earnDashboardModel.creatorHealth.score}
        earnScoreStateLabel={earnDashboardModel.creatorHealth.stateLabel}
        revenueDeltaText={state.latestArtifact?.revenueDeltaText}
        subscriberDeltaText={state.latestArtifact?.subscriberDeltaText}
        loading={state.loading}
      />

      {showDashboardOnboarding ? (
        <DashboardOnboardingSection
          mode="earn"
          hasUpload={state.latestUpload !== null}
          hasReports={state.hasReports}
          growGuidanceLimited={false}
          ctaLabel={primaryCta.label}
          ctaHref={primaryCta.href}
        />
      ) : (
        <>
          {/* Strip 2 — What's happening */}
          <DashboardWhatsHappening
            headline={trendPreview}
            signals={whatsHappeningSignals}
            audienceRows={audienceRows}
            latestReportHref={latestReportHref}
            loading={state.loading}
          />

          {/* Strip 3 — Revenue trend */}
          <RevenueTrendSection
            trend={revenueTrend}
            trendPreview={trendPreview}
            loading={state.loading}
            ctaLabel={primaryCta.label}
            ctaHref={primaryCta.href}
          />

          {/* Strip 4 — Next Move */}
          <DashboardNextMoveSection
            mode={actionCardsSection.mode}
            topCard={actionCardsSection.cards[0] ?? null}
            upgradeHref={primaryCta.href}
          />
        </>
      )}
    </div>
  );
}
