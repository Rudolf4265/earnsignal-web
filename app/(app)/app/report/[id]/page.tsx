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
  fetchReportPdfBlobUrl,
  getReportErrorMessage,
  type ReportDetail,
} from "@/src/lib/api/reports";
import { hydrateDashboardFromArtifact } from "@/src/lib/dashboard/artifact-hydration";
import { getInsightCardPresentation } from "@/src/lib/dashboard/insight-presentation";
import { buildDashboardInsights } from "@/src/lib/dashboard/insights";
import { buildDashboardRevenueTrendViewModel } from "@/src/lib/dashboard/revenue-trend";
import {
  buildReportDetailSectionGatingModel,
  canAccessFullReportPdf,
  canRenderReportDetailProContent,
  canRenderReportDetailReportContent,
  resolveReportDetailPdfAccessMode,
} from "@/src/lib/report/detail-gating";
import { hasProEquivalentEntitlement, isFounderFromEntitlement } from "@/src/lib/entitlements/model";
import { buildReportDetailPresentationModel, type ReportDetailPresentationNotice } from "@/src/lib/report/detail-presentation";
import { getReportViewState, getRequestId, type ReportViewState } from "@/src/lib/report/detail-state";
import { hasUsableReportArtifact } from "@/src/lib/report/artifact-availability";
import { formatReportCreatedAt, toReportStatusLabel, toReportStatusVariant } from "@/src/lib/report/list-model";
import { readReportRouteParamId } from "@/src/lib/report/route-id";
import { normalizeArtifactToReportModel, type ReportViewModel } from "@/src/lib/report/normalize-artifact-to-report-model";
import { formatReportArtifactContractErrors, validateReportArtifactContract } from "@/src/lib/report/artifact-contract";
import { buildReportFraming, formatIncludedSourceCountLabel } from "@/src/lib/report/source-labeling";
import { buildReportWowSummaryViewModel } from "@/src/lib/report/wow-summary-view-model";
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

type ProSectionLockedCardProps = {
  title: string;
  headline: string;
  body: string;
  testId: string;
};

function ProSectionLockedCard({ title, headline, body, testId }: ProSectionLockedCardProps) {
  return (
    <div
      className="relative flex flex-wrap items-end justify-between gap-4 overflow-hidden rounded-2xl border border-brand-border-strong/80 bg-[linear-gradient(155deg,rgba(16,32,67,0.95),rgba(23,49,117,0.78),rgba(15,118,110,0.32))] p-5 shadow-brand-card"
      data-testid={testId}
    >
      <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-brand-accent-blue/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-14 bottom-[-4.5rem] h-36 w-36 rounded-full bg-brand-accent-emerald/16 blur-3xl" />
      <div className="relative space-y-2">
        <p className="inline-flex rounded-full border border-brand-border-strong/80 bg-brand-panel/72 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">
          PRO FEATURE
        </p>
        <h3 className="text-base font-semibold text-brand-text-primary">{title}</h3>
        <p className="text-sm leading-relaxed text-brand-text-secondary">
          <span className="block font-medium text-brand-text-primary">{headline}</span>
          {body}
        </p>
      </div>
      <Link href="/app/billing" className={buttonClassName({ variant: "primary", size: "sm", className: "relative z-10 px-4 shadow-brand-glow" })}>
        Upgrade to Pro
      </Link>
    </div>
  );
}

function ProSectionLoadingCard({ message, testId }: { message: string; testId: string }) {
  return (
    <div
      className="rounded-2xl border border-brand-border/75 bg-[linear-gradient(155deg,rgba(19,41,80,0.74),rgba(16,32,67,0.86))] p-4"
      data-testid={testId}
    >
      <p className="text-sm text-brand-text-secondary">{message}</p>
      <div className="mt-3 space-y-2">
        <div className="h-2.5 w-full animate-pulse rounded-full bg-brand-border/70" />
        <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-brand-border/55" />
      </div>
    </div>
  );
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

function ComparisonBucket({
  title,
  items,
  emptyMessage,
  testId,
}: {
  title: string;
  items: Array<{ id: string; body: string; detail: string | null; stateLabel: string | null; stateTone: "good" | "warn" | "neutral" | null }>;
  emptyMessage: string;
  testId: string;
}) {
  return (
    <article
      className="rounded-[1.15rem] border border-brand-border-strong/70 bg-[linear-gradient(155deg,rgba(19,41,80,0.8),rgba(16,32,67,0.9))] p-4"
      data-testid={testId}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">{title}</p>
        <span className="rounded-full border border-brand-border/70 bg-brand-panel/70 px-2.5 py-1 text-[11px] text-brand-text-muted">
          {items.length}
        </span>
      </div>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-brand-border/70 bg-brand-panel/72 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm leading-relaxed text-brand-text-primary">{item.body}</p>
                {item.stateLabel ? <Badge variant={item.stateTone ?? "neutral"}>{item.stateLabel}</Badge> : null}
              </div>
              {item.detail ? <p className="mt-2 text-xs leading-relaxed text-brand-text-muted">{item.detail}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-brand-border/70 bg-brand-panel-muted/70 p-3.5">
          <p className="text-sm text-brand-text-secondary">{emptyMessage}</p>
        </div>
      )}
    </article>
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
  const [debugOpen, setDebugOpen] = useState(false);
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
  const insightCards = useMemo(
    () =>
      buildDashboardInsights({
        keySignals: presentation?.keySignals ?? [],
        signals: presentation?.signals ?? [],
        maxCards: 3,
      }),
    [presentation?.keySignals, presentation?.signals],
  );
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
  const canAccessDebugPayload = useMemo(() => isFounder || hasProEquivalentEntitlement(entitlements), [entitlements, isFounder]);

  const wowSummary = useMemo(
    () =>
      presentation
        ? buildReportWowSummaryViewModel(presentation, state.artifactModel)
        : null,
    [presentation, state.artifactModel],
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
  const debugJson = useMemo(() => {
    if (!debugOpen || !state.artifactRaw) {
      return null;
    }

    try {
      return JSON.stringify(state.artifactRaw, null, 2);
    } catch {
      return "Unable to serialize artifact JSON.";
    }
  }, [debugOpen, state.artifactRaw]);
  const showSubscriberHealthContent = isFounder || canRenderReportDetailProContent(proSectionGate.subscriberHealth);
  const showGrowthRecommendationsContent = isFounder || canRenderReportDetailProContent(proSectionGate.growthRecommendations);
  const showRevenueOutlookContent = isFounder || canRenderReportDetailProContent(proSectionGate.revenueOutlook);
  const showPlatformRiskExplanationContent = isFounder || canRenderReportDetailProContent(proSectionGate.platformRiskExplanation);

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

          {showFullReportContent ? <> {state.artifactError ? <ErrorBanner title="Artifact JSON unavailable" message={state.artifactError} /> : null}

          <section className="space-y-3">
            <DashboardSectionHeader title="Executive Summary" description="A concise narrative from your latest completed report." />
            <PanelCard className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.92),rgba(19,41,80,0.84),rgba(16,32,67,0.94))]">
              <div className="space-y-2">
                {presentation.executiveSummary.slice(0, 3).map((paragraph, index) => (
                  <p
                    key={`${index}-${paragraph.slice(0, 24)}`}
                    className={`text-sm leading-relaxed ${index === 0 ? "font-medium text-brand-text-primary" : "text-brand-text-secondary"}`}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </PanelCard>
          </section>

          <section className="space-y-3">
            <DashboardSectionHeader title="Key Insights" description="Key signals translated into clear implications for the next planning cycle." />
            <PanelCard className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.9),rgba(16,32,67,0.95))]">
              {insightCards.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-brand-border-strong/70 bg-brand-panel-muted/75 p-5">
                  <p className="text-sm text-brand-text-secondary">Not enough signal data is available to generate narrative insight cards yet.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {insightCards[0] ? (
                    (() => {
                      const insight = insightCards[0];
                      const tone = getInsightCardPresentation(insight.variant);
                      return (
                        <article className={`relative overflow-hidden rounded-[1.2rem] border p-5 shadow-brand-card ${tone.cardClassName}`}>
                          <div className={`absolute inset-x-0 top-0 h-0.5 ${tone.accentClassName}`} />
                          <div className="relative flex flex-wrap items-center gap-2">
                            <Badge variant={tone.badgeVariant} className={`px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${tone.badgeClassName}`}>
                              {tone.badgeLabel}
                            </Badge>
                            {insight.stateLabel ? (
                              <Badge variant={insight.stateTone ?? "neutral"} className="px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]">
                                {insight.stateLabel}
                              </Badge>
                            ) : null}
                          </div>
                          <h3 className="mt-2.5 text-lg font-semibold leading-snug text-brand-text-primary break-words">{insight.title}</h3>
                          <p className="mt-1.5 text-sm leading-relaxed text-brand-text-secondary break-words">{insight.body}</p>
                          {insight.stateDetail ? <p className="mt-1.5 text-xs leading-relaxed text-brand-text-muted break-words">{insight.stateDetail}</p> : null}
                          <p className="mt-2.5 text-xs leading-relaxed text-brand-text-muted/90 break-words">
                            <span className="font-medium text-brand-text-secondary/60">Why it matters — </span>
                            {insight.implication}
                          </p>
                        </article>
                      );
                    })()
                  ) : null}
                  {insightCards.length > 1 ? (
                    <ul className="space-y-2">
                      {insightCards.slice(1, 3).map((insight) => {
                        const tone = getInsightCardPresentation(insight.variant);
                        return (
                          <li key={insight.id}>
                            <article className={`relative overflow-hidden rounded-[1.2rem] border p-4 shadow-brand-card ${tone.cardClassName}`}>
                              <div className={`absolute inset-x-0 top-0 h-0.5 ${tone.accentClassName}`} />
                              <div className="relative flex flex-wrap items-center gap-2">
                                <Badge variant={tone.badgeVariant} className={`px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${tone.badgeClassName}`}>
                                  {tone.badgeLabel}
                                </Badge>
                                {insight.stateLabel ? (
                                  <Badge variant={insight.stateTone ?? "neutral"} className="px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]">
                                    {insight.stateLabel}
                                  </Badge>
                                ) : null}
                              </div>
                              <h3 className="mt-2 text-base font-semibold leading-snug text-brand-text-primary break-words">{insight.title}</h3>
                              <p className="mt-1.5 text-sm leading-relaxed text-brand-text-secondary break-words">{insight.body}</p>
                              {insight.stateDetail ? <p className="mt-1 text-xs leading-relaxed text-brand-text-muted break-words">{insight.stateDetail}</p> : null}
                              <p className="mt-2 text-xs leading-relaxed text-brand-text-muted/90 break-words">
                                <span className="font-medium text-brand-text-secondary/60">Why it matters — </span>
                                {insight.implication}
                              </p>
                            </article>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              )}
            </PanelCard>
          </section>

          <section className="space-y-3" data-testid="report-diagnosis-section">
            <DashboardSectionHeader title="Diagnosis" description="What the data says about your creator business health and growth constraints." />
            <PanelCard className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.9),rgba(16,32,67,0.95))]">
              <div className="space-y-4">
                {presentation.diagnosis.notice ? (
                  <p className="text-xs leading-relaxed text-brand-text-muted/80">
                    <span className="font-medium text-amber-300/55">Confidence note:</span>{" "}
                    {presentation.diagnosis.notice.body}
                  </p>
                ) : null}
                {presentation.diagnosis.diagnosisTypeLabel || presentation.diagnosis.summary || presentation.diagnosis.unavailableBody ? (
                  <article className="rounded-[1.15rem] border border-brand-border-strong/70 bg-[linear-gradient(155deg,rgba(19,41,80,0.78),rgba(16,32,67,0.9))] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Primary typed read</p>
                      {presentation.diagnosis.diagnosisTypeLabel ? (
                        <span className="rounded-full border border-brand-border/70 bg-brand-panel/72 px-3 py-1 text-[11px] font-medium text-brand-text-primary">
                          {presentation.diagnosis.diagnosisTypeLabel}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-brand-text-secondary">
                      {presentation.diagnosis.summary ?? presentation.diagnosis.unavailableBody ?? "Diagnosis details are limited in this report artifact."}
                    </p>
                  </article>
                ) : null}
                {presentation.diagnosis.supportingMetrics.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {presentation.diagnosis.supportingMetrics.slice(0, 3).map((metric) => (
                      <article key={metric.id} className="rounded-xl border border-brand-border-strong/70 bg-[linear-gradient(155deg,rgba(19,41,80,0.8),rgba(16,32,67,0.9))] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">{metric.label}</p>
                          {metric.stateLabel ? <Badge variant={metric.stateTone ?? "neutral"}>{metric.stateLabel}</Badge> : null}
                        </div>
                        <p className="mt-1.5 text-2xl font-semibold tracking-tight text-brand-text-primary">{metric.value}</p>
                        {metric.detail ? <p className="mt-2 text-xs leading-relaxed text-brand-text-muted">{metric.detail}</p> : null}
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>
            </PanelCard>
          </section>

          {presentation.whatChanged.comparisonAvailable ? (
            <section className="space-y-3" data-testid="report-what-changed-section">
              <DashboardSectionHeader title="What Changed" description="Typed report-over-report changes." />
              <PanelCard className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.9),rgba(16,32,67,0.95))]">
                <div className="space-y-4">
                  {presentation.whatChanged.notice ? <TruthNotice notice={presentation.whatChanged.notice} testId="report-what-changed-notice" /> : null}
                  {presentation.whatChanged.priorPeriodLabel ? (
                    <p className="text-xs uppercase tracking-[0.14em] text-brand-text-muted">{presentation.whatChanged.priorPeriodLabel}</p>
                  ) : null}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <ComparisonBucket
                      title="Improved"
                      items={presentation.whatChanged.improved}
                      emptyMessage="No typed improvements were material enough to highlight."
                      testId="report-what-changed-improved"
                    />
                    <ComparisonBucket
                      title="Worsened"
                      items={presentation.whatChanged.worsened}
                      emptyMessage="No typed deterioration was material enough to highlight."
                      testId="report-what-changed-worsened"
                    />
                    <ComparisonBucket
                      title="Watch Next"
                      items={presentation.whatChanged.watchNext}
                      emptyMessage="No typed watch-next items were emitted for this comparison."
                      testId="report-what-changed-watch-next"
                    />
                  </div>
                </div>
              </PanelCard>
            </section>
          ) : (
            <p className="text-xs text-brand-text-muted/70" data-testid="report-what-changed-section">
              <span className="font-medium text-brand-text-muted">Period comparison:</span>{" "}
              {presentation.whatChanged.unavailableBody ?? "A prior comparable report is not available yet."}
            </p>
          )}

          <section className="space-y-3">
            <DashboardSectionHeader title="Revenue History" description={`${presentation.displayContext.historyLabel} — net revenue movement across your report timeline.`} />
            <PanelCard className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.9),rgba(16,32,67,0.95))]">
              {revenueTrend.hasRenderableChart ? (
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
                        {revenueTrend.periodLabel ? (
                          <p className="text-xs text-brand-text-muted">{revenueTrend.periodLabel}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <RevenueTrendChart points={revenueTrend.points} />
                  {presentation.revenueTrend.narrative ? (
                    <p className="rounded-xl border border-brand-border/70 bg-brand-panel/72 px-3 py-2.5 text-sm leading-relaxed text-brand-text-secondary">
                      {presentation.revenueTrend.narrative}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-3">
                  {presentation.revenueTrend.narrative ? (
                    <div className="rounded-2xl border border-brand-border-strong/70 bg-brand-panel/76 p-4">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Latest narrative signal</p>
                      <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{presentation.revenueTrend.narrative}</p>
                    </div>
                  ) : null}
                  <div className="rounded-2xl border border-dashed border-brand-border-strong/70 bg-brand-panel-muted/70 p-4">
                    <p className="text-sm text-brand-text-secondary">Trend chart data is not available in this report artifact.</p>
                  </div>
                </div>
              )}
            </PanelCard>
          </section>

          <section className="space-y-3">
            <DashboardSectionHeader title="Growth Recommendations" description="Recommended actions already captured in the report." />
            <PanelCard className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.9),rgba(16,32,67,0.95))]">
              {showGrowthRecommendationsContent ? (
                <div data-testid="report-growth-recommendations-unlocked">
                  {presentation.recommendations.length > 0 ? (
                    <div className="space-y-3">
                      <article className="relative overflow-hidden rounded-[1.2rem] border border-brand-accent-teal/22 bg-[linear-gradient(155deg,rgba(18,40,82,0.92),rgba(14,30,60,0.94))] p-4 shadow-brand-glow">
                        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-accent-teal/55 via-brand-accent-teal/22 to-transparent" />
                        <p className="text-[10px] uppercase tracking-[0.14em] text-brand-accent-teal/70">
                          {presentation.recommendations[0].label || "Recommended action"}
                        </p>
                        <p className="mt-2 text-base font-semibold leading-snug text-brand-text-primary">{presentation.recommendations[0].body}</p>
                        {presentation.recommendations[0].detail ? (
                          <p className="mt-1.5 text-sm leading-relaxed text-brand-text-secondary">{presentation.recommendations[0].detail}</p>
                        ) : null}
                        {presentation.recommendations[0].stateLabel ? (
                          <div className="mt-2.5">
                            <Badge variant={presentation.recommendations[0].stateTone ?? "neutral"}>{presentation.recommendations[0].stateLabel}</Badge>
                          </div>
                        ) : null}
                      </article>
                      {presentation.recommendations.length > 1 ? (
                        <ul className="space-y-1.5">
                          {presentation.recommendations.slice(1).map((recommendation, index) => (
                            <li key={recommendation.id} className="flex items-start gap-3 rounded-[0.9rem] border border-brand-border/45 bg-brand-panel/40 px-4 py-2.5">
                              <span className="mt-px shrink-0 text-[11px] font-semibold tabular-nums text-brand-text-muted">{index + 2}.</span>
                              <div className="min-w-0">
                                <p className="text-sm leading-relaxed text-brand-text-secondary">{recommendation.body}</p>
                                {recommendation.detail ? <p className="mt-1 text-xs leading-relaxed text-brand-text-muted">{recommendation.detail}</p> : null}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-brand-border-strong/70 bg-brand-panel-muted/75 p-4">
                      <p className="text-sm text-brand-text-secondary">No explicit recommendation list is available for this report.</p>
                    </div>
                  )}
                </div>
              ) : proSectionGate.growthRecommendations === "pro-locked" ? (
                <ProSectionLockedCard
                  testId="report-growth-recommendations-locked"
                  title="Growth Recommendations"
                  headline="Unlock growth recommendations"
                  body="Get personalized actions based on your revenue and audience signals."
                />
              ) : (
                <ProSectionLoadingCard
                  testId="report-growth-recommendations-loading"
                  message="Checking plan access for growth recommendations..."
                />
              )}
            </PanelCard>
          </section>

          <section className="space-y-3">
            <DashboardSectionHeader title="Subscriber Health" description="Retention, churn, and subscriber quality signals in one place." />
            <PanelCard className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.9),rgba(16,32,67,0.95))]">
              {showSubscriberHealthContent ? (
                <div data-testid="report-subscriber-health-unlocked">
                  {presentation.subscriberHealth.notice ? <TruthNotice notice={presentation.subscriberHealth.notice} testId="report-subscriber-health-notice" /> : null}
                  {presentation.subscriberHealth.metrics.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {presentation.subscriberHealth.metrics.map((metric) => (
                        <article
                          key={metric.id}
                          className="rounded-xl border border-brand-border-strong/70 bg-[linear-gradient(155deg,rgba(19,41,80,0.8),rgba(16,32,67,0.9))] p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">{metric.label}</p>
                            {metric.stateLabel ? <Badge variant={metric.stateTone ?? "neutral"}>{metric.stateLabel}</Badge> : null}
                          </div>
                          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-brand-text-primary">{metric.value}</p>
                          {metric.detail ? <p className="mt-2 text-xs leading-relaxed text-brand-text-muted">{metric.detail}</p> : null}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-brand-border-strong/70 bg-brand-panel-muted/75 p-4">
                      <p className="text-sm text-brand-text-secondary">Subscriber health metrics are unavailable in this report.</p>
                    </div>
                  )}
                  {presentation.subscriberHealth.highlights.length > 0 ? (
                    <div className="mt-3 rounded-xl border border-brand-border/55 bg-brand-panel/50 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-brand-text-muted">Historical trend</p>
                      <div className="mt-2 space-y-1.5">
                        {presentation.subscriberHealth.highlights.map((line) => (
                          <p key={line} className="text-xs leading-relaxed text-brand-text-secondary">{line}</p>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : proSectionGate.subscriberHealth === "pro-locked" ? (
                <ProSectionLockedCard
                  testId="report-subscriber-health-locked"
                  title="Subscriber Health"
                  headline="Unlock subscriber health insights"
                  body="Understand churn risk, retention trends, and subscriber value."
                />
              ) : (
                <ProSectionLoadingCard
                  testId="report-subscriber-health-loading"
                  message="Checking plan access for subscriber health insights..."
                />
              )}
            </PanelCard>
          </section>

          <section className="space-y-3">
            <DashboardSectionHeader title="Current Revenue Mix" description="Concentration and channel exposure based on the latest available snapshot." />
            <PanelCard className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.9),rgba(16,32,67,0.95))]">
              {presentation.platformMix.notice ? <TruthNotice notice={presentation.platformMix.notice} testId="report-platform-mix-notice" /> : null}
              {presentation.platformMix.concentrationScore !== null ||
              presentation.platformMix.platformsConnected !== null ||
              presentation.platformMix.highlights.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <article className="rounded-xl border border-brand-border-strong/70 bg-[linear-gradient(155deg,rgba(19,41,80,0.8),rgba(16,32,67,0.9))] p-4">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Platform Risk Score</p>
                      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-brand-text-primary">
                        {presentation.platformMix.concentrationScore !== null
                          ? `${presentation.platformMix.concentrationScore % 1 === 0 ? presentation.platformMix.concentrationScore.toFixed(0) : presentation.platformMix.concentrationScore.toFixed(1)}%`
                          : "--"}
                      </p>
                      {presentation.platformMix.concentrationScore !== null ? (
                        <div className="mt-3 h-2 rounded-full bg-brand-panel-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-accent-blue via-brand-accent-blue to-brand-accent-emerald"
                            style={{
                              width: `${Math.max(8, Math.min(100, Math.round(presentation.platformMix.concentrationScore)))}%`,
                            }}
                          />
                        </div>
                      ) : null}
                    </article>

                    <article className="rounded-xl border border-brand-border-strong/70 bg-[linear-gradient(155deg,rgba(19,41,80,0.8),rgba(16,32,67,0.9))] p-4">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">Sources Included</p>
                      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-brand-text-primary">
                        {presentation.platformMix.platformsConnected !== null ? presentation.platformMix.platformsConnected : "--"}
                      </p>
                      <p className="mt-2 text-xs text-brand-text-muted">
                        {presentation.platformMix.platformsConnected === 1
                          ? "Built from a single source. Add another to strengthen cross-platform analysis."
                          : "Data contributing to this report."}
                      </p>
                    </article>
                  </div>
                  <p className="text-xs leading-relaxed text-brand-text-muted">
                    A concentration score above 70% signals meaningful single-platform dependency. Track alongside connected platform count to monitor diversification over time.
                  </p>
                  {presentation.platformMix.platformsConnected === 1 ? (
                    <p className="text-xs leading-relaxed text-brand-text-muted" data-testid="report-thin-source-notice">
                      <span className="font-medium text-brand-text-secondary">This is a single-source report.</span>{" "}
                      Add another data source to your workspace for a fuller cross-platform picture and stronger recommendations.
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-brand-border-strong/70 bg-brand-panel-muted/75 p-4">
                  <p className="text-sm text-brand-text-secondary">Platform mix details are not available in this report artifact.</p>
                </div>
              )}

              <section className="mt-4 space-y-2" data-testid="report-platform-risk-explanation">
                <h3 className="text-sm font-semibold text-brand-text-primary">Platform Risk Explanation</h3>
                {showPlatformRiskExplanationContent ? (
                  <div data-testid="report-platform-risk-explanation-unlocked">
                    {presentation.platformMix.highlights.length > 0 ? (
                      <div className="space-y-1.5">
                        {presentation.platformMix.highlights.map((line) => (
                          <p key={line} className="text-sm leading-relaxed text-brand-text-secondary">{line}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-brand-text-muted">Platform concentration analysis is not available for this report period.</p>
                    )}
                  </div>
                ) : proSectionGate.platformRiskExplanation === "pro-locked" ? (
                  <ProSectionLockedCard
                    testId="report-platform-risk-explanation-locked"
                    title="Platform Risk Explanation"
                    headline="Unlock platform risk analysis"
                    body="See why concentration risk is elevated and what it means for your business."
                  />
                ) : (
                  <ProSectionLoadingCard
                    testId="report-platform-risk-explanation-loading"
                    message="Checking plan access for platform risk analysis..."
                  />
                )}
              </section>
            </PanelCard>
          </section>

          <section className="space-y-3">
            <DashboardSectionHeader title="Revenue Outlook" description="Outlook scenarios based on available projection signals." />
            <PanelCard className="border-brand-border/75 bg-[linear-gradient(155deg,rgba(16,32,67,0.94),rgba(19,41,80,0.9),rgba(16,32,67,0.95))]">
              {showRevenueOutlookContent ? (
                <div data-testid="report-revenue-outlook-unlocked">
                  {presentation.revenueOutlook.notice ? <TruthNotice notice={presentation.revenueOutlook.notice} testId="report-revenue-outlook-notice" /> : null}
                  {presentation.revenueOutlook.cards.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      {presentation.revenueOutlook.cards.map((card) => (
                        <article
                          key={card.id}
                          className="rounded-xl border border-brand-border-strong/70 bg-[linear-gradient(155deg,rgba(19,41,80,0.8),rgba(16,32,67,0.9))] p-3.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[11px] uppercase tracking-[0.14em] text-brand-text-secondary">{card.title}</p>
                            {card.stateLabel ? <Badge variant={card.stateTone ?? "neutral"}>{card.stateLabel}</Badge> : null}
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{card.body}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-brand-border-strong/70 bg-brand-panel-muted/75 p-4">
                      <p className="text-sm text-brand-text-secondary">Outlook scenarios are not available in this report artifact.</p>
                    </div>
                  )}
                  {presentation.revenueOutlook.highlights.length > 0 ? (
                    <div className="mt-3 space-y-1">
                      {presentation.revenueOutlook.highlights.map((line) => (
                        <p key={line} className="text-xs leading-relaxed text-brand-text-muted">{line}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : proSectionGate.revenueOutlook === "pro-locked" ? (
                <ProSectionLockedCard
                  testId="report-revenue-outlook-locked"
                  title="Revenue Outlook"
                  headline="Unlock revenue forecasts"
                  body="See projected revenue scenarios for the months ahead."
                />
              ) : (
                <ProSectionLoadingCard testId="report-revenue-outlook-loading" message="Checking plan access for revenue forecasts..." />
              )}
            </PanelCard>
          </section>

          <section className="space-y-3" data-testid="report-next-steps">
            <DashboardSectionHeader title="What to do next" description="Suggested actions based on your current report. These recommendations are based on your current data." />
            <div className="rounded-[1.15rem] border border-brand-border-strong/70 bg-[linear-gradient(155deg,rgba(19,41,80,0.8),rgba(16,32,67,0.9))] p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1.5">
                  {presentation.platformMix.platformsConnected !== null && presentation.platformMix.platformsConnected <= 1 ? (
                    <>
                      <p className="text-sm font-medium text-brand-text-primary" data-testid="report-next-steps-single-source">
                        Add another source to deepen your analysis.
                      </p>
                      <p className="text-xs leading-relaxed text-brand-text-secondary">
                        This report was built from a single source. Adding a second report-driving source unlocks richer cross-platform comparisons and sharper recommendations.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-brand-text-primary" data-testid="report-next-steps-multi-source">
                        Keep your workspace up to date to maintain accurate insights.
                      </p>
                      <p className="text-xs leading-relaxed text-brand-text-secondary">
                        Upload updated data to your workspace to refresh your combined report with your latest numbers.
                      </p>
                    </>
                  )}
                </div>
                <Link
                  href="/app/data"
                  data-testid="report-return-to-workspace"
                  className="inline-flex shrink-0 rounded-xl border border-brand-border/60 bg-brand-panel/50 px-3 py-2 text-sm font-medium text-brand-text-secondary transition hover:bg-brand-panel/80 hover:text-brand-text-primary"
                >
                  Return to workspace
                </Link>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <DashboardSectionHeader title="Appendix" description="Technical and verbose details from the artifact payload." />
            <details>
              <summary className="cursor-pointer rounded-xl border border-brand-border/55 bg-brand-panel/55 px-4 py-2.5 text-sm text-brand-text-muted hover:text-brand-text-secondary [list-style:none] [&::-webkit-details-marker]:hidden">
                Show appendix details
              </summary>
              <div className="mt-3">
                <PanelCard className="border-brand-border/65 bg-brand-panel/72">
                  {presentation.appendixSections.length > 0 ? (
                    <div className="space-y-4">
                      {presentation.appendixSections.map((section) => (
                        <article key={section.id} className="rounded-xl border border-brand-border/60 bg-brand-panel-muted/50 p-4">
                          <h3 className="text-sm font-semibold text-brand-text-secondary">{section.title}</h3>
                          {section.paragraphs.length > 0 ? (
                            <div className="mt-2 space-y-2">
                              {section.paragraphs.map((paragraph, index) => (
                                <p key={`${section.id}-paragraph-${index}`} className="text-xs leading-relaxed text-brand-text-muted">
                                  {paragraph}
                                </p>
                              ))}
                            </div>
                          ) : null}
                          {section.bullets.length > 0 ? (
                            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-brand-text-muted">
                              {section.bullets.map((bullet, index) => (
                                <li key={`${section.id}-bullet-${index}`}>{bullet}</li>
                              ))}
                            </ul>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-brand-text-secondary">No appendix sections were provided in this report artifact.</p>
                  )}

                  {canAccessDebugPayload ? (
                    <details
                      data-testid="report-debug-accordion"
                      className="mt-4 rounded-2xl border border-brand-border/70 bg-brand-bg-elevated/72 p-4"
                      onToggle={(event) => setDebugOpen(event.currentTarget.open)}
                    >
                      <summary className="cursor-pointer text-sm font-semibold text-brand-text-primary">Debug + Raw JSON</summary>
                      <div className="mt-3 space-y-3">
                        {state.artifactWarnings.length > 0 ? (
                          <div className="rounded-xl border border-amber-300/40 bg-amber-500/[0.08] p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-100">Normalization warnings</p>
                            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-100">
                              {state.artifactWarnings.map((warning) => (
                                <li key={warning}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        {state.artifactRaw && debugJson ? (
                          <pre data-testid="report-debug-json" className="overflow-x-auto rounded-xl border border-brand-border bg-slate-950 p-3 text-xs text-slate-100">
                            {debugJson}
                          </pre>
                        ) : state.artifactRaw ? (
                          <p className="text-xs text-brand-text-muted">Expand Debug to render artifact JSON.</p>
                        ) : (
                          <p className="text-xs text-brand-text-muted">Artifact JSON is unavailable.</p>
                        )}
                      </div>
                    </details>
                  ) : null}
                </PanelCard>
              </div>
            </details>
          </section>
          </> : null}
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
