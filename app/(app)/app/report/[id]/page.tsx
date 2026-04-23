"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatPricingPlanPrice, getPricingPlan } from "@earnsigma/config";
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
import { getConfidenceLabelTooltip } from "@/src/lib/report/truth";
import { isFounderFromEntitlement } from "@/src/lib/entitlements/model";
import { buildReportDetailPresentationModel, type ReportDetailPresentationNotice } from "@/src/lib/report/detail-presentation";
import { getReportViewState, getRequestId, type ReportViewState } from "@/src/lib/report/detail-state";
import { hasUsableReportArtifact } from "@/src/lib/report/artifact-availability";
import { formatReportCreatedAt, isInFlightReportStatus, toReportStatusLabel, toReportStatusVariant } from "@/src/lib/report/list-model";
import { readReportRouteParamId } from "@/src/lib/report/route-id";
import { normalizeArtifactToReportModel, type ReportViewModel } from "@/src/lib/report/normalize-artifact-to-report-model";
import { formatReportArtifactContractErrors, patchSparseArtifact, validateReportArtifactContract } from "@/src/lib/report/artifact-contract";
import { buildReportFraming, formatIncludedSourceCountLabel } from "@/src/lib/report/source-labeling";
import { buildReportWowSummaryViewModel } from "@/src/lib/report/wow-summary-view-model";
import { buildRevenueExplanation } from "@/src/lib/report/premium-narrative";
import { ReportAudienceGrowthSection } from "./_components/ReportAudienceGrowthSection";
import { ReportDiagnosisCallout } from "./_components/ReportDiagnosisCallout";
import { ReportExecutiveNarrative } from "./_components/ReportExecutiveNarrative";
import { ReportOutlookSection } from "./_components/ReportOutlookSection";
import { ReportStrengthsRisksSection } from "./_components/ReportStrengthsRisksSection";
import { ReportSubscriberHealthSection } from "./_components/ReportSubscriberHealthSection";
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
const reportPlan = getPricingPlan("report");

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
        <span className="font-semibold text-brand-text-primary">Full PDF Export.</span> A {formatPricingPlanPrice(reportPlan)} Report or Pro access is required to open and download this creator earnings report PDF.
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

const STABILITY_COMPONENT_LABELS: Record<string, string> = {
  momentum: "Revenue Momentum",
  volatility: "Revenue Consistency",
  churn: "Subscriber Retention",
  concentration: "Platform Diversity",
  data_quality: "Data Quality",
};

const STABILITY_COMPONENT_ORDER = ["momentum", "volatility", "churn", "concentration", "data_quality"];

function stabilityBarColor(score: number): string {
  if (score >= 75) return "bg-brand-accent-emerald";
  if (score >= 50) return "bg-amber-400";
  return "bg-rose-400/80";
}

function stabilityTextColor(score: number): string {
  if (score >= 75) return "text-brand-accent-emerald";
  if (score >= 50) return "text-amber-300";
  return "text-rose-300";
}

function stabilitySurfaceClass(score: number): string {
  if (score >= 75) {
    return "border-brand-accent-emerald/25 bg-[linear-gradient(165deg,rgba(14,44,57,0.82),rgba(12,31,48,0.92))]";
  }
  if (score >= 50) {
    return "border-amber-400/25 bg-[linear-gradient(165deg,rgba(49,36,14,0.78),rgba(29,22,10,0.92))]";
  }
  return "border-rose-400/25 bg-[linear-gradient(165deg,rgba(53,22,29,0.78),rgba(30,14,19,0.92))]";
}

function stabilityCaption(score: number): string {
  if (score >= 75) return "Supporting the overall health score.";
  if (score >= 50) return "Worth watching, but not breaking the picture.";
  return "This is dragging on the overall health read.";
}

function expectedImpactLabel(value: string): string {
  if (value === "high") return "High impact";
  if (value === "medium") return "Medium impact";
  if (value === "low") return "Low impact";
  return value;
}

function expectedImpactChipClass(value: string): string {
  if (value === "high") return "border-brand-accent-emerald/45 bg-brand-accent-emerald/10 text-brand-accent-emerald";
  if (value === "medium") return "border-brand-accent-blue/40 bg-brand-accent-blue/10 text-brand-accent-blue";
  return "border-brand-border-strong/50 bg-brand-panel/50 text-brand-text-muted";
}

function platformShareBarColor(sharePct: number): string {
  if (sharePct >= 70) return "bg-amber-400";
  if (sharePct >= 45) return "bg-brand-accent-blue";
  return "bg-brand-accent-emerald";
}

function platformShareBandLabel(index: number, sharePct: number): string {
  if (sharePct >= 70) return "Carrying most of revenue";
  if (index === 0) return "Leading source";
  if (sharePct >= 25) return "Meaningful support";
  return "Smaller contribution";
}

function concentrationRiskTone(score: number): { label: string; textClassName: string; pillClassName: string } {
  if (score >= 70) {
    return {
      label: "High",
      textClassName: "text-amber-300",
      pillClassName: "border-amber-400/35 bg-amber-400/12 text-amber-300",
    };
  }

  if (score >= 40) {
    return {
      label: "Medium",
      textClassName: "text-brand-accent-blue",
      pillClassName: "border-brand-accent-blue/35 bg-brand-accent-blue/12 text-brand-accent-blue",
    };
  }

  return {
    label: "Low",
    textClassName: "text-brand-accent-emerald",
    pillClassName: "border-brand-accent-emerald/35 bg-brand-accent-emerald/12 text-brand-accent-emerald",
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

          const artifactPatched = patchSparseArtifact(artifactRaw);
          const contract = validateReportArtifactContract(artifactPatched);
          const normalized = normalizeArtifactToReportModel(artifactPatched);
          if (!contract.valid) {
            setState({
              view: "success",
              report,
              artifactModel: normalized.model,
              artifactWarnings: [...contract.errors, ...normalized.warnings],
              artifactRaw: artifactPatched,
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
            artifactRaw: artifactPatched,
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
        ? buildReportWowSummaryViewModel(presentation, state.artifactModel, state.report, { includeContinuitySignals: true })
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
                <div className="space-y-3">
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
                        {metric.stateLabel ? <Badge variant={metric.stateTone ?? "neutral"} tooltip={getConfidenceLabelTooltip(metric.stateLabel)}>{metric.stateLabel}</Badge> : null}
                      </div>
                      <p className="mt-2 text-3xl font-semibold tracking-tight text-brand-text-primary">{metric.value}</p>
                      {metric.detail ? <p className="mt-2 text-xs leading-relaxed text-brand-text-muted">{metric.detail}</p> : null}
                    </article>
                  ))}
                </div>
                {presentation.stabilityComponents ? (
                  <div
                    className="overflow-hidden rounded-[1.15rem] border border-brand-border-strong/60 bg-[linear-gradient(165deg,rgba(15,31,63,0.88),rgba(19,41,80,0.72),rgba(13,28,57,0.92))] px-4 py-4 shadow-brand-card"
                    data-testid="report-stability-components"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-accent-blue">Income Health Breakdown</p>
                        <p className="mt-1 text-sm leading-relaxed text-brand-text-secondary">
                          The pieces holding the health score up, and the ones putting pressure on it.
                        </p>
                      </div>
                      <span className="inline-flex rounded-full border border-brand-border/55 bg-brand-panel/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">
                        Same data, clearer read
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      {STABILITY_COMPONENT_ORDER.map((key) => {
                        const score = presentation.stabilityComponents?.[key];
                        if (score == null) return null;
                        const label = STABILITY_COMPONENT_LABELS[key] ?? key;
                        return (
                          <article
                            key={key}
                            className={`rounded-[1rem] border p-3 shadow-brand-card ${stabilitySurfaceClass(score)}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] uppercase leading-tight tracking-[0.12em] text-brand-text-muted">{label}</span>
                              <span className={`text-sm font-semibold tabular-nums ${stabilityTextColor(score)}`}>{score}</span>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-brand-panel-muted/55">
                              <div
                                className={`h-full rounded-full ${stabilityBarColor(score)}`}
                                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                              />
                            </div>
                            <p className="mt-2 text-[11px] leading-relaxed text-brand-text-secondary">{stabilityCaption(score)}</p>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
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

              <ReportExecutiveNarrative
                paragraphs={presentation.executiveSummary}
                summarySentence={wowSummary?.summarySentence ?? null}
              />

              <ReportDiagnosisCallout diagnosis={presentation.diagnosis} />

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

              {presentation.platformMix.platformShares && presentation.platformMix.platformShares.length > 0 ? (
                <section className="space-y-3" data-testid="report-platform-mix">
                  <DashboardSectionHeader
                    title="Revenue by Platform"
                    description="Where income is coming from and how concentrated it is across your sources."
                  />
                  <PanelCard className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.9),rgba(16,32,67,0.95))]">
                    <div className="space-y-3.5">
                      {presentation.platformMix.platformShares.map((row, index) => {
                        const sharePct = Math.round(row.share * 100);
                        return (
                          <article
                            key={row.platform}
                            className="rounded-[1rem] border border-brand-border/55 bg-[linear-gradient(165deg,rgba(18,37,74,0.72),rgba(11,24,50,0.84))] p-3.5 shadow-brand-card"
                            data-testid="report-platform-mix-row"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold capitalize text-brand-text-primary">{row.platform}</span>
                                  <span className="inline-flex rounded-full border border-brand-border/50 bg-brand-panel/50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-brand-text-muted">
                                    {platformShareBandLabel(index, sharePct)}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-brand-text-muted">{sharePct}% of tracked revenue</p>
                              </div>
                              <div className="text-right">
                                {row.revenue > 0 ? (
                                  <p className="text-sm font-semibold tabular-nums text-brand-text-primary">
                                    ${Math.round(row.revenue).toLocaleString("en-US")}
                                  </p>
                                ) : null}
                                <p className="mt-0.5 text-[11px] tabular-nums text-brand-text-muted">{sharePct}% share</p>
                              </div>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-brand-panel-muted/55">
                              <div
                                className={`h-full rounded-full ${platformShareBarColor(sharePct)}`}
                                style={{ width: `${sharePct}%` }}
                              />
                            </div>
                          </article>
                        );
                      })}
                    </div>
                    {presentation.platformMix.concentrationScore !== null ? (
                      <div className="mt-4 rounded-[1rem] border border-brand-border/50 bg-brand-panel/55 px-4 py-3">
                        {(() => {
                          const tone = concentrationRiskTone(presentation.platformMix.concentrationScore);
                          return (
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">Concentration read</p>
                                <p className="mt-1 text-sm leading-relaxed text-brand-text-secondary">
                                  Your current revenue mix reads as{" "}
                                  <span className={`font-semibold ${tone.textClassName}`}>{tone.label.toLowerCase()}</span>{" "}
                                  concentration risk across tracked sources.
                                </p>
                              </div>
                              <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${tone.pillClassName}`}>
                                {tone.label} risk {Math.round(presentation.platformMix.concentrationScore)}%
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    ) : null}
                  </PanelCard>
                </section>
              ) : null}

              <ReportSubscriberHealthSection model={presentation.subscriberHealth} />

              {presentation.audienceGrowth ? (
                <section className="space-y-3">
                  <DashboardSectionHeader
                    title="Audience Growth"
                    description="Where attention is growing, what to watch, and where to lean next."
                  />
                  <ReportAudienceGrowthSection model={presentation.audienceGrowth} />
                </section>
              ) : null}

              {wowSummary ? <ReportStrengthsRisksSection model={wowSummary.strengthsRisks} /> : null}

              {wowSummary ? (
                <section className="space-y-3" data-testid="report-what-to-do-next">
                  <DashboardSectionHeader
                    title="What to do next"
                    description="Start with the move most connected to the diagnosis, then use the follow-up move to make it stick."
                  />
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                    {wowSummary.nextActions.length > 0 ? (
                      wowSummary.nextActions.map((action, index) => (
                        <PanelCard
                          key={action.id}
                          className={`border-brand-border/75 ${
                            index === 0
                              ? "relative overflow-hidden bg-[linear-gradient(155deg,rgba(18,40,82,0.92),rgba(14,30,60,0.94),rgba(10,64,77,0.44))] shadow-brand-glow"
                              : "bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.9),rgba(16,32,67,0.95))]"
                          }`}
                          data-testid={index === 0 ? "report-next-action-primary" : "report-next-action-secondary"}
                        >
                          {index === 0 ? (
                            <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-accent-teal/16 blur-3xl" />
                          ) : null}
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${index === 0 ? "text-brand-accent-teal" : "text-brand-accent-blue"}`}>
                                  {index === 0 ? "Start here" : "Then reinforce"}
                                </p>
                                {presentation.recommendations[index]?.expectedImpact ? (
                                  <span
                                    className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${expectedImpactChipClass(presentation.recommendations[index]?.expectedImpact ?? "low")}`}
                                  >
                                    {expectedImpactLabel(presentation.recommendations[index]?.expectedImpact ?? "low")}
                                  </span>
                                ) : null}
                              </div>
                              {action.timeframe ? (
                                <span className="rounded-full border border-brand-border/70 bg-brand-panel/60 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-brand-text-muted">
                                  {action.timeframe}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-lg font-semibold leading-snug text-brand-text-primary md:text-[1.15rem]">{action.title}</p>
                            {action.detail ? <p className="text-sm leading-relaxed text-brand-text-secondary">{action.detail}</p> : null}
                            <p className="text-xs leading-relaxed text-brand-text-muted">
                              {index === 0
                                ? "This is the move most likely to change the business read in the next cycle."
                                : "Use this once the first change is underway so the gain has somewhere to compound."}
                            </p>
                          </div>
                        </PanelCard>
                      ))
                    ) : (
                      <PanelCard className="border-brand-border/75 bg-brand-panel/72 md:col-span-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">
                          Limited action signal
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">
                          This report has enough signal for a business read, but not enough history to rank precise actions.
                          Use the biggest opportunity above as the first move, then rerun once another month of data is present.
                        </p>
                      </PanelCard>
                    )}
                  </div>
                  {presentation.recommendations.length > 2 ? (
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text-muted">
                        Additional recommendations
                      </p>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {presentation.recommendations.slice(2).map((rec) => (
                          <article
                            key={rec.id}
                            className="rounded-[1.05rem] border border-brand-border/65 bg-[linear-gradient(155deg,rgba(16,32,67,0.88),rgba(19,41,80,0.82))] p-4"
                            data-testid="report-additional-recommendation"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              {rec.label ? (
                                <p className="text-[10px] uppercase tracking-[0.12em] text-brand-text-muted">{rec.label}</p>
                              ) : null}
                              {rec.stateLabel ? (
                                <Badge variant={rec.stateTone ?? "neutral"}>{rec.stateLabel}</Badge>
                              ) : null}
                            </div>
                            <p className="mt-2 text-sm font-semibold leading-snug text-brand-text-primary">{rec.body}</p>
                            {rec.detail ? (
                              <p className="mt-1.5 text-xs leading-relaxed text-brand-text-secondary">{rec.detail}</p>
                            ) : null}
                            {rec.expectedImpact ? (
                              <span
                                className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${expectedImpactChipClass(rec.expectedImpact)}`}
                                data-testid="report-rec-impact-chip"
                              >
                                {expectedImpactLabel(rec.expectedImpact)}
                              </span>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1rem] border border-brand-border/55 bg-[linear-gradient(165deg,rgba(18,37,74,0.58),rgba(11,24,50,0.72))] px-4 py-3">
                    <p className="text-xs leading-relaxed text-brand-text-secondary">
                      {presentation.platformMix.platformsConnected !== null && presentation.platformMix.platformsConnected <= 1
                        ? "Adding one more source or owned channel will make the next report more useful and less fragile."
                        : "Upload a fresh data pull after your next cycle so the next recommendation is based on what changed, not what you remember."}
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

              <ReportOutlookSection model={presentation.revenueOutlook} />
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
