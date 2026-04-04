"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "../../_components/dashboard/Badge";
import { DashboardSectionHeader } from "../../_components/dashboard/DashboardSectionHeader";
import { Panel } from "../../_components/dashboard/Panel";
import { RevenueTrendChart } from "../../_components/dashboard/RevenueTrendChart";
import { useAppGate } from "../../../_components/app-gate-provider";
import { FeatureGuard } from "../../../_components/feature-guard";
import { SessionExpiredCallout } from "../../../_components/gate-callouts";
import { buttonClassName } from "@/src/components/ui/button";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { PanelCard } from "@/src/components/ui/panel-card";
import { isApiError } from "@/src/lib/api/client";
import {
  downloadReportArtifactPdf,
  fetchReportArtifactJson,
  fetchReportDetail,
  fetchReportRunStatus,
  fetchReportPdfBlobUrl,
  getReportErrorMessage,
  type ReportDetail,
} from "@/src/lib/api/reports";
import { hydrateDashboardFromArtifact } from "@/src/lib/dashboard/artifact-hydration";
import { buildDashboardRevenueTrendViewModel } from "@/src/lib/dashboard/revenue-trend";
import {
  buildReportDetailSectionGatingModel,
  canAccessFullReportPdf,
  canRenderReportDetailReportContent,
  resolveReportDetailPdfAccessMode,
} from "@/src/lib/report/detail-gating";
import { isFounderFromEntitlement } from "@/src/lib/entitlements/model";
import { buildReportDetailPresentationModel, type ReportDetailPresentationNotice } from "@/src/lib/report/detail-presentation";
import { getReportViewState, getRequestId, type ReportViewState } from "@/src/lib/report/detail-state";
import { hasUsableReportArtifact } from "@/src/lib/report/artifact-availability";
import { formatReportCreatedAt, isInFlightReportStatus, toReportStatusLabel, toReportStatusVariant } from "@/src/lib/report/list-model";
import { readReportRouteParamId } from "@/src/lib/report/route-id";
import { normalizeArtifactToReportModel, type ReportViewModel } from "@/src/lib/report/normalize-artifact-to-report-model";
import { formatReportArtifactContractErrors, validateReportArtifactContract } from "@/src/lib/report/artifact-contract";
import { buildReportFraming, formatIncludedSourceCountLabel } from "@/src/lib/report/source-labeling";
import { buildReportWowSummaryViewModel } from "@/src/lib/report/wow-summary-view-model";
import { ReportAudienceGrowthSection } from "./_components/ReportAudienceGrowthSection";
import { ReportWowSummary } from "./_components/ReportWowSummary";
import { buildReportFreeTeaserViewModel, ReportFreeTeaser } from "./_components/ReportFreeTeaser";

type ReportPageState = {
  view: ReportViewState | "invalid_route";
  report: ReportDetail | null;
  artifactModel: ReportViewModel | null;
  artifactWarnings: string[];
  artifactRaw: unknown | null;
  artifactError: string | null;
  artifactJsonMissing: boolean;
  requestId?: string;
};

const initialState: ReportPageState = {
  view: "loading",
  report: null,
  artifactModel: null,
  artifactWarnings: [],
  artifactRaw: null,
  artifactError: null,
  artifactJsonMissing: false,
};
const REPORT_DETAIL_POLL_INTERVAL_MS = 3_000;

function toArtifactErrorMessage(error: unknown): string {
  if (isApiError(error) && error.code === "INVALID_JSON_RESPONSE") {
    const details = error.details;
    const contentType =
      details && typeof details === "object" && typeof (details as Record<string, unknown>).__responseContentType === "string"
        ? ((details as Record<string, unknown>).__responseContentType as string)
        : "unknown";

    return `Artifact JSON returned non-JSON content (HTTP ${error.status}, content-type: ${contentType}).`;
  }

  return getReportErrorMessage(error);
}

function TruthNotice({ notice, testId }: { notice: ReportDetailPresentationNotice; testId?: string }) {
  const toneClassName =
    notice.tone === "warn"
      ? "border-amber-300/40 bg-amber-500/[0.08]"
      : notice.tone === "good"
        ? "border-emerald-300/35 bg-emerald-500/[0.08]"
        : "border-brand-border-strong/70 bg-brand-panel/72";

  return (
    <div className={`rounded-2xl border p-4 ${toneClassName}`} data-testid={testId}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={notice.tone}>{notice.label}</Badge>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{notice.body}</p>
    </div>
  );
}

function PdfExportLockedState() {
  return (
    <div
      className="relative flex max-w-full flex-wrap items-center gap-2 overflow-hidden rounded-2xl border border-brand-border-strong/80 bg-[linear-gradient(155deg,rgba(16,32,67,0.95),rgba(23,49,117,0.78),rgba(15,118,110,0.32))] px-3 py-2 shadow-brand-card"
      data-testid="report-pdf-locked"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-brand-accent-blue/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-[-3rem] h-24 w-24 rounded-full bg-brand-accent-emerald/16 blur-3xl" />
      <span className="relative inline-flex rounded-full border border-brand-border-strong/80 bg-brand-panel/72 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">
        Report Access
      </span>
      <p className="relative text-xs text-brand-text-secondary">
        <span className="font-semibold text-brand-text-primary">Full PDF Export.</span> Report or Pro access is required to open and download this creator earnings report PDF.
      </p>
      <Link
        href="/app/billing"
        className={buttonClassName({ variant: "primary", size: "sm", className: "relative z-10 ml-auto px-3 shadow-brand-glow" })}
      >
        View plans
      </Link>
    </div>
  );
}

function PdfExportLoadingState() {
  return (
    <div
      className="rounded-2xl border border-brand-border/75 bg-[linear-gradient(155deg,rgba(19,41,80,0.74),rgba(16,32,67,0.86))] px-3 py-2"
      data-testid="report-pdf-loading"
    >
      <p className="text-xs text-brand-text-secondary">Checking plan access for full PDF export...</p>
    </div>
  );
}

function buildRevenueExplanation({
  movementLabel,
  narrative,
  snapshotCoverageNote,
}: {
  movementLabel: string | null;
  narrative: string | null;
  snapshotCoverageNote: string | null;
}) {
  const normalizedMovement = movementLabel?.toLowerCase() ?? "";
  const normalizedNarrative = narrative?.toLowerCase() ?? "";
  const movementSentence =
    movementLabel && normalizedMovement.includes("down")
      ? `Revenue is ${movementLabel.replace(/vs start/i, "from the start of this period").toLowerCase()}.`
      : movementLabel && normalizedMovement.includes("up")
        ? `Revenue is ${movementLabel.replace(/vs start/i, "from the start of this period").toLowerCase()}.`
        : movementLabel && normalizedMovement.includes("flat")
          ? "Revenue held mostly steady across this report window."
          : null;

  const whatHappened = narrative
    ? normalizedNarrative.includes("directional guidance")
      ? movementSentence ?? "Revenue trend data is limited in this report."
      : narrative
    : movementSentence ?? "Revenue trend data is limited in this report.";

  const whyItMatters = snapshotCoverageNote
    ? "The latest period only reflects part of your source mix, so read the newest swing as directional instead of assuming the whole business changed equally."
    : normalizedMovement.includes("down")
      ? "When revenue starts slipping, the business usually needs a clearer retention, offer, or growth focus before income gets less predictable."
      : normalizedMovement.includes("up")
        ? "An improving trend is a good sign, but it is strongest when that growth comes from more than one repeatable source."
        : "A flat trend can feel calm, but it often means the next growth lever has not fully clicked yet.";

  const whatToWatch = snapshotCoverageNote
    ? "Watch the next full period before treating this as a business-wide drop, then act on the clearest pattern that holds."
    : normalizedMovement.includes("down")
      ? "Watch whether your next period stabilizes or keeps sliding, then prioritize the action that most directly supports revenue."
      : normalizedMovement.includes("up")
        ? "Keep an eye on whether the improvement holds long enough to become a pattern instead of a one-period spike."
        : "Use the next period to confirm whether this steadiness is healthy consistency or early slowing momentum.";

  return {
    whatHappened,
    whyItMatters,
    whatToWatch,
  };
}

export default function ReportPage() {
  const { state: gateState, entitlements } = useAppGate();
  const params = useParams<{ id?: string | string[] }>();
  const routeParamId = params?.id;
  const routeParamIdForDebug = useMemo(() => {
    if (Array.isArray(routeParamId)) {
      return routeParamId.join(",");
    }

    return routeParamId ?? null;
  }, [routeParamId]);
  const canonicalReportId = useMemo(() => readReportRouteParamId({ id: routeParamId }), [routeParamId]);
  const [state, setState] = useState<ReportPageState>(initialState);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const canAccessPdf = useMemo(
    () =>
      state.report
        ? hasUsableReportArtifact({
            reportId: state.report.id,
            status: state.report.status,
            artifactUrl: state.report.artifactUrl,
          })
        : false,
    [state.report],
  );

  useEffect(() => {
    let cancelled = false;
    const activeReportId = canonicalReportId;

    setState(initialState);
    setPdfError(null);

    if (!activeReportId) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[report.detail] route parameter [id] is missing or invalid; blocking detail fetch.", {
          routeParamId: routeParamIdForDebug,
        });
      }

      setState({
        ...initialState,
        view: "invalid_route",
      });
      return () => {
        cancelled = true;
      };
    }
    const resolvedReportId: string = activeReportId;

    async function load() {
      try {
        const report = await fetchReportDetail(resolvedReportId);
        if (cancelled) {
          return;
        }

        if (!report.artifactJsonUrl) {
          setState({
            view: "success",
            report,
            artifactModel: null,
            artifactWarnings: [],
            artifactRaw: null,
            artifactError: null,
            artifactJsonMissing: true,
          });
          return;
        }

        try {
          const artifactRaw = await fetchReportArtifactJson(report.artifactJsonUrl);
          if (cancelled) {
            return;
          }

          const contract = validateReportArtifactContract(artifactRaw);
          const normalized = normalizeArtifactToReportModel(artifactRaw);
          if (!contract.valid) {
            setState({
              view: "success",
              report,
              artifactModel: normalized.model,
              artifactWarnings: [...contract.errors, ...normalized.warnings],
              artifactRaw,
              artifactError: formatReportArtifactContractErrors(contract.errors),
              artifactJsonMissing: false,
            });
            return;
          }

          setState({
            view: "success",
            report,
            artifactModel: normalized.model,
            artifactWarnings: normalized.warnings,
            artifactRaw,
            artifactError: null,
            artifactJsonMissing: false,
          });
        } catch (artifactError) {
          if (cancelled) {
            return;
          }

          setState({
            view: "success",
            report,
            artifactModel: null,
            artifactWarnings: [],
            artifactRaw: null,
            artifactError: toArtifactErrorMessage(artifactError),
            artifactJsonMissing: false,
          });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState({
          ...initialState,
          view: getReportViewState(error),
          requestId: getRequestId(error),
        });
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [canonicalReportId, reloadNonce, routeParamIdForDebug]);

  useEffect(() => {
    if (state.view !== "success" || !state.report || !isInFlightReportStatus(state.report.status)) {
      return;
    }

    let cancelled = false;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    const activeReportId = state.report.id;

    const pollStatus = async () => {
      try {
        const latestStatus = await fetchReportRunStatus(activeReportId);
        if (cancelled) {
          return;
        }

        const nextStatus = latestStatus.status.trim() || state.report?.status || "unknown";
        setState((current) => {
          if (!current.report || current.report.id !== activeReportId) {
            return current;
          }

          if (current.report.status === nextStatus && current.report.updatedAt === (latestStatus.updatedAt ?? current.report.updatedAt)) {
            return current;
          }

          return {
            ...current,
            report: {
              ...current.report,
              status: nextStatus,
              updatedAt: latestStatus.updatedAt ?? current.report.updatedAt,
            },
          };
        });

        const normalizedNextStatus = nextStatus.toLowerCase();
        if (["ready", "completed", "complete", "success", "succeeded"].includes(normalizedNextStatus)) {
          setReloadNonce((current) => current + 1);
          return;
        }

        if (!isInFlightReportStatus(nextStatus)) {
          return;
        }
      } catch {
        // Keep the current report detail state intact and try again on the next interval.
      }

      if (!cancelled) {
        timeoutHandle = setTimeout(() => {
          void pollStatus();
        }, REPORT_DETAIL_POLL_INTERVAL_MS);
      }
    };

    timeoutHandle = setTimeout(() => {
      void pollStatus();
    }, REPORT_DETAIL_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
      }
    };
  }, [state.report, state.view]);

  const openPdf = async () => {
    if (!state.report || !canAccessFullPdf || !canAccessPdf || pdfLoading) {
      return;
    }

    setPdfError(null);
    setPdfLoading(true);
    const popup = window.open("", "_blank", "noopener,noreferrer");

    try {
      const pdfBlobUrl = await fetchReportPdfBlobUrl(state.report);
      if (popup) {
        popup.location.href = pdfBlobUrl;
      } else {
        window.open(pdfBlobUrl, "_blank", "noopener,noreferrer");
      }

      window.setTimeout(() => {
        if (pdfBlobUrl.startsWith("blob:")) {
          URL.revokeObjectURL(pdfBlobUrl);
        }
      }, 120_000);
    } catch (error) {
      popup?.close();
      setPdfError(getReportErrorMessage(error));
    } finally {
      setPdfLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!state.report || !canAccessFullPdf || !canAccessPdf || downloadLoading) {
      return;
    }

    setPdfError(null);
    setDownloadLoading(true);

    try {
      await downloadReportArtifactPdf({
        reportId: state.report.id,
        title: state.report.title,
        artifactUrl: state.report.artifactUrl,
      });
    } catch (error) {
      setPdfError(getReportErrorMessage(error));
    } finally {
      setDownloadLoading(false);
    }
  };

  const artifactSignals = useMemo(() => {
    if (!state.artifactRaw) {
      return null;
    }

    return hydrateDashboardFromArtifact(state.artifactRaw);
  }, [state.artifactRaw]);

  const presentation = useMemo(() => {
    if (!state.report) {
      return null;
    }

    return buildReportDetailPresentationModel({
      report: state.report,
      artifactModel: state.artifactModel,
      artifactSignals: artifactSignals ?? null,
    });
  }, [artifactSignals, state.artifactModel, state.report]);
  const revenueTrend = useMemo(
    () =>
      buildDashboardRevenueTrendViewModel({
        points: presentation?.revenueTrend.points ?? [],
      }),
    [presentation?.revenueTrend.points],
  );
  const proSectionGate = useMemo(
    () =>
      buildReportDetailSectionGatingModel({
        gateState,
        entitlements,
      }),
    [entitlements, gateState],
  );
  const pdfAccessMode = useMemo(
    () =>
      resolveReportDetailPdfAccessMode({
        gateState,
        entitlements,
      }),
    [entitlements, gateState],
  );
  const isFounder = useMemo(() => isFounderFromEntitlement(entitlements), [entitlements]);
  const canAccessFullPdf = isFounder || canAccessFullReportPdf(pdfAccessMode);

  const wowSummary = useMemo(
    () =>
      presentation
        ? buildReportWowSummaryViewModel(presentation, state.artifactModel, state.report, { includeContinuitySignals: false })
        : null,
    [presentation, state.artifactModel, state.report],
  );
  const freeTeaserModel = useMemo(
    () => (presentation ? buildReportFreeTeaserViewModel(presentation) : null),
    [presentation],
  );
  const showFullReportContent = isFounder || canRenderReportDetailReportContent(proSectionGate.wowSummary);

  const createdAtLabel = formatReportCreatedAt(state.report?.createdAt ?? state.artifactModel?.createdAt ?? null);
  const status = state.report?.status ?? "unknown";
  const statusLabel = toReportStatusLabel(status);
  const statusVariant = toReportStatusVariant(status);
  const reportFraming = useMemo(
    () =>
      buildReportFraming({
        platformsIncluded: state.report?.platformsIncluded,
        sourceCount: state.report?.sourceCount ?? state.report?.metrics.platformsConnected ?? null,
      }),
    [state.report],
  );
  const sourceCountLabel = useMemo(
    () => formatIncludedSourceCountLabel(state.report?.sourceCount ?? state.report?.metrics.platformsConnected ?? null),
    [state.report],
  );
  const legacyPlatformCount = presentation?.platformMix.platformsConnected ?? null;
  const legacyPlatformCountLabel =
    typeof legacyPlatformCount === "number" && legacyPlatformCount > 0
      ? `${legacyPlatformCount} ${legacyPlatformCount === 1 ? "source" : "sources"} included`
      : null;
  const revenueExplanation = useMemo(
    () =>
      buildRevenueExplanation({
        movementLabel: revenueTrend.movementLabel ?? null,
        narrative: presentation?.revenueTrend.narrative ?? null,
        snapshotCoverageNote: state.report?.snapshotCoverageNote ?? null,
      }),
    [presentation?.revenueTrend.narrative, revenueTrend.movementLabel, state.report?.snapshotCoverageNote],
  );

  return (
    <FeatureGuard feature="report">
      {state.view === "loading" ? (
        <div className="space-y-3" data-testid="report-loading">
          <h1 className="text-2xl font-semibold">Loading report...</h1>
          <p className="text-sm text-slate-400">Fetching report details for {canonicalReportId ?? "unknown report"}.</p>
        </div>
      ) : null}

      {state.view === "success" && state.report && presentation ? (
        <section className="space-y-8" data-testid="report-content">
          <PanelCard className="relative overflow-hidden border-brand-border-strong/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.96),rgba(23,49,117,0.82),rgba(15,118,110,0.28))] p-0">
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-brand-accent-blue/22 blur-3xl" />
            <div className="pointer-events-none absolute -left-16 bottom-[-5rem] h-40 w-40 rounded-full bg-brand-accent-emerald/16 blur-3xl" />
            <div className="relative space-y-6 p-6 md:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <p className="inline-flex rounded-full border border-brand-border-strong/80 bg-brand-panel/75 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">
                    {reportFraming.badgeLabel}
                  </p>
                  <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-brand-text-primary md:text-[2rem]">{presentation.heroTitle}</h1>
                    {presentation.heroSubtitle ? <p className="mt-1.5 text-sm text-brand-text-secondary">{presentation.heroSubtitle}</p> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-text-muted">
                    <span>Created {createdAtLabel}</span>
                    {sourceCountLabel ? <span aria-hidden="true" className="text-brand-text-muted/35">|</span> : null}
                    {sourceCountLabel ? <span data-testid="report-source-count">{sourceCountLabel}</span> : null}
                    {reportFraming.helperText ? <span aria-hidden="true" className="text-brand-text-muted/35">|</span> : null}
                    {reportFraming.helperText ? (
                      <span
                        data-testid={state.report.reportKind === "single-source" ? "report-single-source-framing" : "report-combined-framing"}
                      >
                        {reportFraming.helperText}
                      </span>
                    ) : null}
                    {false ? (
                      <>
                    <span aria-hidden="true" className="text-brand-text-muted/35">·</span>
                    <span data-testid="report-combined-framing">Your combined cross-platform report — built from your creator data sources</span>
                    {legacyPlatformCountLabel ? (
                      <>
                        <span aria-hidden="true" className="text-brand-text-muted/35">·</span>
                        <span data-testid="report-source-count">{legacyPlatformCountLabel}</span>
                      </>
                    ) : null}
                      </>
                    ) : null}
                  </div>
                  {state.report.platformsIncluded.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2" data-testid="report-platform-chips">
                      {state.report.platformsIncluded.map((platform) => (
                        <Badge key={platform} variant="neutral">
                          {platform}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {presentation.displayContext.sourceContributionLine ? (
                    <p className="text-xs text-brand-text-muted" data-testid="report-source-contribution">
                      {presentation.displayContext.sourceContributionLine}
                    </p>
                  ) : null}
                  {state.report.snapshotCoverageNote ? (
                    <p className="text-xs text-brand-text-muted" data-testid="report-snapshot-coverage-note">
                      {state.report.snapshotCoverageNote}
                    </p>
                  ) : null}
                  {state.report.youtubeContributionMode === "content_only" ? (
                    <p className="text-xs text-brand-text-muted" data-testid="report-youtube-contribution-note">
                      YouTube data includes content performance only (revenue not included in business metrics).
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant}>{statusLabel}</Badge>
                  {pdfAccessMode === "pdf-unlocked" ? (
                    canAccessPdf ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void openPdf()}
                          disabled={pdfLoading}
                          className="inline-flex rounded-xl bg-brand-accent-blue px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {pdfLoading ? "Opening PDF..." : "Open PDF"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void downloadPdf()}
                          disabled={downloadLoading}
                          className="inline-flex rounded-xl bg-brand-accent-blue px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {downloadLoading ? "Downloading PDF..." : "Download PDF"}
                        </button>
                      </>
                    ) : (
                      <span className="inline-flex rounded-full border border-amber-300/35 bg-amber-300/15 px-3 py-1.5 text-xs font-medium text-amber-100">
                        PDF unavailable
                      </span>
                    )
                  ) : pdfAccessMode === "pdf-locked" ? (
                    <PdfExportLockedState />
                  ) : (
                    <PdfExportLoadingState />
                  )}
                </div>
              </div>

              {presentation.heroNotice ? <TruthNotice notice={presentation.heroNotice} testId="report-hero-truth-notice" /> : null}
              {showFullReportContent ? (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-brand-text-muted" data-testid="report-snapshot-label">
                    {presentation.displayContext.snapshotLabel}
                  </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {presentation.heroMetrics.map((metric) => (
                    <article
                      key={metric.id}
                      className="rounded-[1.1rem] border border-brand-border-strong/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.96),rgba(19,41,80,0.9),rgba(16,32,67,0.95))] p-4 shadow-brand-card"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">{metric.label}</p>
                        {metric.stateLabel ? <Badge variant={metric.stateTone ?? "neutral"}>{metric.stateLabel}</Badge> : null}
                      </div>
                      <p className="mt-2 text-3xl font-semibold tracking-tight text-brand-text-primary">{metric.value}</p>
                      {metric.detail ? <p className="mt-2 text-xs leading-relaxed text-brand-text-muted">{metric.detail}</p> : null}
                    </article>
                  ))}
                </div>
                </div>
              ) : null}
            </div>
          </PanelCard>

          {pdfError ? <ErrorBanner title="PDF unavailable" message={pdfError} /> : null}

          {showFullReportContent && wowSummary ? (
            <ReportWowSummary model={wowSummary} />
          ) : !isFounder && proSectionGate.wowSummary === "report-locked" && freeTeaserModel ? (
            <ReportFreeTeaser model={freeTeaserModel} />
          ) : null}

          {showFullReportContent && state.artifactJsonMissing ? (
            <Panel title="Artifact JSON Unavailable" description="This report does not include a JSON artifact yet.">
              <div className="space-y-3">
                <p className="text-sm text-slate-600">Try refreshing to load updated report metadata.</p>
                <button
                  type="button"
                  onClick={() => setReloadNonce((prev) => prev + 1)}
                  className="inline-flex rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Refresh
                </button>
              </div>
            </Panel>
          ) : null}

          {showFullReportContent ? (
            <>
              {state.artifactError ? <ErrorBanner title="Artifact JSON unavailable" message={state.artifactError} /> : null}

              <section className="space-y-3">
                <DashboardSectionHeader
                  title="Revenue Trend"
                  description={presentation.displayContext.historyLabel || "How income moved across your report window."}
                />
                <PanelCard className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.9),rgba(16,32,67,0.95))]">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-brand-border-strong/70 bg-brand-panel/70 px-4 py-3 shadow-brand-card">
                        <div className="flex flex-wrap items-end justify-between gap-2">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Latest revenue</p>
                            <p className="mt-1 text-2xl font-semibold tracking-tight text-brand-text-primary md:text-3xl">
                              {revenueTrend.latestValueDisplay ?? "$--"}
                            </p>
                          </div>
                          <div className="space-y-0.5 text-right">
                            {revenueTrend.movementLabel ? (
                              <p className="inline-flex rounded-full border border-brand-border-strong/75 bg-brand-panel/70 px-3 py-0.5 text-xs font-semibold tracking-[0.08em] text-brand-text-secondary">
                                {revenueTrend.movementLabel}
                              </p>
                            ) : null}
                            {revenueTrend.periodLabel ? <p className="text-xs text-brand-text-muted">{revenueTrend.periodLabel}</p> : null}
                          </div>
                        </div>
                      </div>
                      {revenueTrend.hasRenderableChart ? (
                        <div className="rounded-2xl border border-brand-border-strong/70 bg-brand-panel/60 p-3">
                          <RevenueTrendChart points={revenueTrend.points} />
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-brand-border-strong/70 bg-brand-panel-muted/70 p-4">
                          <p className="text-sm text-brand-text-secondary">Trend chart data is not available in this report artifact.</p>
                        </div>
                      )}
                    </div>

                    <article
                      className="rounded-[1.1rem] border border-brand-border-strong/70 bg-brand-panel/72 p-4"
                      data-testid="report-revenue-interpretation"
                    >
                      <p className="text-[11px] uppercase tracking-[0.14em] text-brand-accent-blue">What this means</p>
                      <div className="mt-3 space-y-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-brand-text-muted">What happened</p>
                          <p className="mt-1 text-sm leading-relaxed text-brand-text-primary">{revenueExplanation.whatHappened}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-brand-text-muted">Why it matters</p>
                          <p className="mt-1 text-sm leading-relaxed text-brand-text-secondary">{revenueExplanation.whyItMatters}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-brand-text-muted">What to watch next</p>
                          <p className="mt-1 text-sm leading-relaxed text-brand-text-secondary">{revenueExplanation.whatToWatch}</p>
                        </div>
                      </div>
                    </article>
                  </div>
                </PanelCard>
              </section>

              {presentation.audienceGrowth ? (
                <section className="space-y-3">
                  <DashboardSectionHeader
                    title="Audience Growth"
                    description="Where attention is growing, what to watch, and where to lean next."
                  />
                  <ReportAudienceGrowthSection model={presentation.audienceGrowth} />
                </section>
              ) : null}

              {wowSummary ? (
                <section className="space-y-3" data-testid="report-what-to-do-next">
                  <DashboardSectionHeader title="What to do next" description="Start with the clearest move, then use the second action to reinforce it." />
                  <div className="grid gap-3 md:grid-cols-2">
                    {wowSummary.nextActions.length > 0 ? (
                      wowSummary.nextActions.map((action, index) => (
                        <PanelCard
                          key={action.id}
                          className={`border-brand-border/75 ${
                            index === 0
                              ? "bg-[linear-gradient(155deg,rgba(18,40,82,0.92),rgba(14,30,60,0.94))] shadow-brand-glow"
                              : "bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.9),rgba(16,32,67,0.95))]"
                          }`}
                          data-testid={index === 0 ? "report-next-action-primary" : "report-next-action-secondary"}
                        >
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-accent-teal">
                                {index === 0 ? "Primary Action" : "Secondary Action"}
                              </p>
                              {action.timeframe ? (
                                <span className="rounded-full border border-brand-border/70 bg-brand-panel/60 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-brand-text-muted">
                                  {action.timeframe}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-lg font-semibold leading-snug text-brand-text-primary">{action.title}</p>
                            {action.detail ? <p className="text-sm leading-relaxed text-brand-text-secondary">{action.detail}</p> : null}
                          </div>
                        </PanelCard>
                      ))
                    ) : (
                      <PanelCard className="border-brand-border/75 bg-brand-panel/72">
                        <p className="text-sm leading-relaxed text-brand-text-secondary">
                          The report does not include a clear next-step list yet. Use the biggest opportunity and audience sections to choose the next move.
                        </p>
                      </PanelCard>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-border/55 bg-brand-panel/50 px-4 py-3">
                    <p className="text-xs leading-relaxed text-brand-text-secondary">
                      {presentation.platformMix.platformsConnected !== null && presentation.platformMix.platformsConnected <= 1
                        ? "Adding one more source or owned channel will make the next report more useful and less fragile."
                        : "Upload a fresh data pull after your next cycle so this diagnosis stays current."}
                    </p>
                    <Link
                      href="/app/data"
                      data-testid="report-return-to-workspace"
                      className="inline-flex shrink-0 rounded-xl border border-brand-border/60 bg-brand-panel/50 px-3 py-2 text-sm font-medium text-brand-text-secondary transition hover:bg-brand-panel/80 hover:text-brand-text-primary"
                    >
                      Return to workspace
                    </Link>
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </section>
      ) : null}

      {state.view === "not_found" ? (
        <section className="space-y-3" data-testid="report-not-found">
          <h1 className="text-2xl font-semibold">Report not found</h1>
          <p className="text-slate-400">
            We could not find a report with ID {canonicalReportId ?? "unknown"}. It may have been deleted or never existed.
          </p>
          <Link href="/app/report" className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100">
            Back to Reports
          </Link>
        </section>
      ) : null}

      {state.view === "invalid_route" ? (
        <section className="space-y-3" data-testid="report-invalid-route">
          <h1 className="text-2xl font-semibold">Invalid report route</h1>
          <p className="text-slate-400">The report URL is missing a valid report ID.</p>
          <Link href="/app/report" className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100">
            Back to Reports
          </Link>
        </section>
      ) : null}

      {state.view === "forbidden" ? (
        <section className="space-y-3" data-testid="report-forbidden">
          <h1 className="text-2xl font-semibold">Unauthorized access</h1>
          <p className="text-slate-400">You do not have permission to view this report.</p>
          <Link href="/app" className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100">
            Back to Dashboard
          </Link>
        </section>
      ) : null}

      {state.view === "entitlement_required" && !isFounder ? (
        <section className="space-y-3" data-testid="report-entitlement-required">
          <h1 className="text-2xl font-semibold">Upgrade required</h1>
          <p className="text-slate-400">This report requires Report or Pro access. Continue in Billing to unlock access.</p>
          <Link href="/app/billing" className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100">
            Go to Billing
          </Link>
        </section>
      ) : state.view === "entitlement_required" ? (
        <section className="space-y-3" data-testid="report-founder-override-retry">
          <h1 className="text-2xl font-semibold">Access sync required</h1>
          <p className="text-slate-400">Founder override was detected, but this report request still returned a gated response. Retry to refresh access.</p>
          <button
            type="button"
            onClick={() => setReloadNonce((prev) => prev + 1)}
            className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100"
          >
            Retry
          </button>
        </section>
      ) : null}

      {state.view === "session_expired" ? <SessionExpiredCallout requestId={state.requestId} /> : null}

      {state.view === "server_error" ? (
        <div data-testid="report-error">
          <ErrorBanner
            title="Report unavailable"
            message="We could not load this report due to a server error. Please try again shortly."
            requestId={state.requestId}
            action={
              <Link href="/app/report" className="inline-flex rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50">
                Back to Reports
              </Link>
            }
          />
        </div>
      ) : null}
    </FeatureGuard>
  );
}
