"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "../../_components/dashboard/Badge";
import { KpiCard } from "../../_components/dashboard/KpiCard";
import { Panel } from "../../_components/dashboard/Panel";
import { FeatureGuard } from "../../../_components/feature-guard";
import { SessionExpiredCallout } from "../../../_components/gate-callouts";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { isApiError } from "@/src/lib/api/client";
import {
  downloadReportArtifactPdf,
  fetchReportArtifactJson,
  fetchReportDetail,
  fetchReportPdfBlobUrl,
  getReportErrorMessage,
  type ReportDetail,
} from "@/src/lib/api/reports";
import { getReportViewState, getRequestId, type ReportViewState } from "@/src/lib/report/detail-state";
import { hasUsableReportArtifact } from "@/src/lib/report/artifact-availability";
import { formatReportCreatedAt, toReportStatusLabel, toReportStatusVariant } from "@/src/lib/report/list-model";
import { readReportRouteParamId } from "@/src/lib/report/route-id";
import { normalizeArtifactToReportModel, type ReportViewModel } from "@/src/lib/report/normalize-artifact-to-report-model";

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

function isSummaryPlaceholder(summary: string): boolean {
  return summary.trim().toLowerCase() === "no summary available.";
}

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

export default function ReportPage() {
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

          const normalized = normalizeArtifactToReportModel(artifactRaw);
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
    if (!state.report || !canAccessPdf || pdfLoading) {
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
    if (!state.report || !canAccessPdf || downloadLoading) {
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

  const displayKpis = useMemo(
    () => ({
      netRevenue: state.artifactModel?.kpis.netRevenue ?? state.report?.metrics.netRevenue ?? null,
      subscribers: state.artifactModel?.kpis.subscribers ?? state.report?.metrics.subscribers ?? null,
      stabilityIndex: state.artifactModel?.kpis.stabilityIndex ?? state.report?.metrics.stabilityIndex ?? null,
      churnVelocity: state.artifactModel?.kpis.churnVelocity ?? state.report?.metrics.churnVelocity ?? null,
    }),
    [state.artifactModel, state.report],
  );

  const hasKpis = useMemo(
    () => [displayKpis.netRevenue, displayKpis.subscribers, displayKpis.stabilityIndex, displayKpis.churnVelocity].some((entry) => entry !== null),
    [displayKpis],
  );

  const summaryParagraphs = useMemo(() => {
    if (state.artifactModel && state.artifactModel.executiveSummaryParagraphs.length > 0) {
      return state.artifactModel.executiveSummaryParagraphs;
    }

    if (state.report?.summary && !isSummaryPlaceholder(state.report.summary)) {
      return [state.report.summary];
    }

    return [];
  }, [state.artifactModel, state.report]);

  const createdAtLabel = formatReportCreatedAt(state.report?.createdAt ?? state.artifactModel?.createdAt ?? null);
  const status = state.report?.status ?? "unknown";
  const statusLabel = toReportStatusLabel(status);
  const statusVariant = toReportStatusVariant(status);
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

  return (
    <FeatureGuard feature="report">
      {state.view === "loading" ? (
        <div className="space-y-3" data-testid="report-loading">
          <h1 className="text-2xl font-semibold">Loading report...</h1>
          <p className="text-sm text-slate-400">Fetching report details for {canonicalReportId ?? "unknown report"}.</p>
        </div>
      ) : null}

      {state.view === "success" && state.report ? (
        <section className="space-y-6" data-testid="report-content">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{state.report.title}</h1>
              <p className="mt-1 text-sm text-slate-600">Created {createdAtLabel}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant}>{statusLabel}</Badge>
              {canAccessPdf ? (
                <>
                  <button
                    type="button"
                    onClick={() => void openPdf()}
                    disabled={pdfLoading}
                    className="inline-flex rounded-xl bg-brand-blue px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pdfLoading ? "Opening PDF..." : "Open PDF"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void downloadPdf()}
                    disabled={downloadLoading}
                    className="inline-flex rounded-xl bg-brand-blue px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {downloadLoading ? "Downloading PDF..." : "Download PDF"}
                  </button>
                </>
              ) : (
                <span className="inline-flex rounded-full border border-amber-300/35 bg-amber-300/15 px-3 py-1.5 text-xs font-medium text-amber-100">
                  PDF unavailable
                </span>
              )}
            </div>
          </div>

          {pdfError ? <ErrorBanner title="PDF unavailable" message={pdfError} /> : null}

          {state.artifactJsonMissing ? (
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

          {state.artifactError ? <ErrorBanner title="Artifact JSON unavailable" message={state.artifactError} /> : null}

          {hasKpis ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Net Revenue" value={formatCurrency(displayKpis.netRevenue)} />
              <KpiCard label="Subscribers" value={formatNumber(displayKpis.subscribers)} />
              <KpiCard label="Stability Index" value={formatNumber(displayKpis.stabilityIndex)} />
              <KpiCard label="Churn Velocity" value={formatNumber(displayKpis.churnVelocity)} />
            </div>
          ) : null}

          {summaryParagraphs.length > 0 ? (
            <Panel title="Executive Summary">
              <div className="space-y-3">
                {summaryParagraphs.map((paragraph, index) => (
                  <p key={`${index}-${paragraph.slice(0, 24)}`} className="text-sm text-slate-700">
                    {paragraph}
                  </p>
                ))}
              </div>
            </Panel>
          ) : null}

          {state.artifactModel?.sections.length ? (
            <Panel title="Sections">
              <div className="space-y-5">
                {state.artifactModel.sections.map((section, index) => (
                  <article key={`${index}-${section.title ?? "untitled"}`} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    {section.title ? <h3 className="text-sm font-semibold text-slate-900">{section.title}</h3> : null}
                    {section.paragraphs.length > 0 ? (
                      <div className="space-y-2">
                        {section.paragraphs.map((paragraph, paragraphIndex) => (
                          <p key={`${index}-p-${paragraphIndex}`} className="text-sm text-slate-700">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    ) : null}
                    {section.bullets.length > 0 ? (
                      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                        {section.bullets.map((bullet, bulletIndex) => (
                          <li key={`${index}-b-${bulletIndex}`}>{bullet}</li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>
            </Panel>
          ) : null}

          <details
            data-testid="report-debug-accordion"
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            onToggle={(event) => setDebugOpen(event.currentTarget.open)}
          >
            <summary className="cursor-pointer text-sm font-semibold text-slate-900">Debug</summary>
            <div className="mt-3 space-y-3">
              {state.artifactWarnings.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Normalization warnings</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-800">
                    {state.artifactWarnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {state.artifactRaw && debugJson ? (
                <pre data-testid="report-debug-json" className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-3 text-xs text-slate-100">
                  {debugJson}
                </pre>
              ) : state.artifactRaw ? (
                <p className="text-xs text-slate-600">Expand Debug to render artifact JSON.</p>
              ) : (
                <p className="text-xs text-slate-600">Artifact JSON is unavailable.</p>
              )}
            </div>
          </details>
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
