"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import Link from "next/link";
import { FeatureGuard } from "../../../_components/feature-guard";
import { NotEntitledCallout, SessionExpiredCallout } from "../../../_components/gate-callouts";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { getReport, type ReportDetail } from "@/src/lib/api/reports";
import { ApiError, getApiBaseOrigin } from "@/src/lib/api/client";
import { fetchReportJsonArtifact, fetchReportPdfArtifact } from "@/src/lib/report/artifacts";
import { getReportViewState, getRequestId, type ReportViewState } from "@/src/lib/report/detail-state";
import { hasKpiData, normalizeArtifactToReportModel, type ReportArtifactModel } from "@/src/lib/report/report-artifact-model";
import { KpiCard } from "../../_components/dashboard/KpiCard";
import { Panel } from "../../_components/dashboard/Panel";

type ReportPageState = {
  view: ReportViewState;
  report: ReportDetail | null;
  reportPayload: Record<string, unknown> | null;
  reportModel: ReportArtifactModel | null;
  payloadError?: string;
  requestId?: string;
};

const initialState: ReportPageState = {
  view: "loading",
  report: null,
  reportPayload: null,
  reportModel: null,
};

type ArtifactLoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; message: string }
  | { kind: "session_expired"; message: string; requestId?: string }
  | { kind: "error"; message: string; requestId?: string };

function formatDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return date.toLocaleDateString();
}

function buildJsonError(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Unable to load report JSON artifact right now.";
  }

  const contentType =
    error.details && typeof error.details === "object" && "contentType" in error.details
      ? String((error.details as Record<string, unknown>).contentType ?? "unknown")
      : "unknown";

  return `Unable to load report JSON artifact (${error.code}, status ${error.status}, content-type: ${contentType}).`;
}

function triggerDownload(blob: Blob, reportId: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `${reportId}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

export function ReportDetailClient({ reportId }: { reportId: string }) {
  const [state, setState] = useState<ReportPageState>(initialState);
  const [retryToken, setRetryToken] = useState(0);
  const [artifactState, setArtifactState] = useState<ArtifactLoadState>({ kind: "idle" });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const report = await getReport(reportId);
        const jsonUrl = report.artifactJsonUrl;

        if (!jsonUrl) {
          if (!cancelled) {
            setState({
              view: "success",
              report,
              reportPayload: null,
              reportModel: null,
              payloadError: "JSON artifact is not available yet. Refresh after the report finishes processing.",
            });
          }
          return;
        }

        const { data } = await createClient().auth.getSession();
        const token = data.session?.access_token ?? null;
        if (!token) {
          if (!cancelled) {
            setState({
              view: "session_expired",
              report: null,
              reportPayload: null,
              reportModel: null,
            });
          }
          return;
        }

        try {
          const payload = await fetchReportJsonArtifact({ artifactJsonUrl: jsonUrl, token, origin: getApiBaseOrigin() });

          if (!cancelled) {
            setState({
              view: "success",
              report,
              reportPayload: payload,
              reportModel: normalizeArtifactToReportModel(payload),
            });
          }
        } catch (error) {
          if (!cancelled) {
            setState({
              view: "success",
              report,
              reportPayload: null,
              reportModel: null,
              payloadError: buildJsonError(error),
              requestId: getRequestId(error),
            });
          }
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState({
          view: getReportViewState(error),
          report: null,
          reportPayload: null,
          reportModel: null,
          requestId: getRequestId(error),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reportId, retryToken]);

  async function loadPdf(mode: "open" | "download") {
    const artifactUrl = state.report?.artifactUrl;
    if (!artifactUrl) {
      return;
    }

    setArtifactState({ kind: "loading" });

    try {
      const { data } = await createClient().auth.getSession();
      const token = data.session?.access_token ?? null;
      if (!token) {
        setArtifactState({ kind: "session_expired", message: "Session expired — log in again." });
        return;
      }

      const blob = await fetchReportPdfArtifact({ artifactUrl, token, origin: getApiBaseOrigin() });

      if (mode === "open") {
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
        setArtifactState({ kind: "success", message: "Opened PDF in a new tab." });
      } else {
        triggerDownload(blob, state.report?.id ?? reportId);
        setArtifactState({ kind: "success", message: "Downloaded PDF report." });
      }
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setArtifactState({
          kind: "session_expired",
          message: "Session expired — log in again.",
          requestId: error.requestId,
        });
        return;
      }

      const friendlyMessage =
        error instanceof ApiError && error.code === "UNEXPECTED_CONTENT_TYPE"
          ? error.message
          : "Unable to load report PDF right now. Please try again.";

      setArtifactState({
        kind: "error",
        message: friendlyMessage,
        requestId: error instanceof ApiError ? error.requestId : undefined,
      });
    }
  }

  return (
    <FeatureGuard feature="report">
      {state.view === "loading" ? (
        <div className="space-y-3" data-testid="report-loading">
          <h1 className="text-2xl font-semibold">Loading report…</h1>
          <p className="text-sm text-slate-400">Fetching report details for {reportId}.</p>
        </div>
      ) : null}

      {state.view === "success" && state.report ? (
        <section className="space-y-4" data-testid="report-content">
          <Panel
            title={state.report.title}
            description={state.report.summary}
            rightSlot={<span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-700">{state.report.status}</span>}
          >
            <dl className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <div><dt className="text-slate-600">Report ID</dt><dd>{state.report.id}</dd></div>
              <div><dt className="text-slate-600">Created</dt><dd>{formatDate(state.report.createdAt ?? state.reportModel?.createdAt)}</dd></div>
            </dl>
          </Panel>

          {state.reportModel && hasKpiData(state.reportModel) ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" data-testid="report-kpis">
              {state.reportModel.kpis.netRevenue ? <KpiCard label="Net Revenue" value={state.reportModel.kpis.netRevenue} /> : null}
              {state.reportModel.kpis.subscribers ? <KpiCard label="Subscribers" value={state.reportModel.kpis.subscribers} /> : null}
              {state.reportModel.kpis.stabilityIndex ? <KpiCard label="Stability Index" value={state.reportModel.kpis.stabilityIndex} /> : null}
              {state.reportModel.kpis.churnVelocity ? <KpiCard label="Churn Velocity" value={state.reportModel.kpis.churnVelocity} /> : null}
            </div>
          ) : null}

          {state.reportModel?.executiveSummaryParagraphs.length ? (
            <Panel title="Executive Summary">
              <div className="space-y-2">
                {state.reportModel.executiveSummaryParagraphs.map((paragraph, index) => (
                  <p key={`${paragraph}-${index}`} className="text-sm text-slate-700">{paragraph}</p>
                ))}
              </div>
            </Panel>
          ) : null}

          {state.reportModel?.sections.length ? (
            <Panel title="Sections">
              <div className="space-y-4" data-testid="report-json-sections">
                {state.reportModel.sections.map((section, index) => (
                  <article key={`${section.title}-${index}`} className="rounded-lg border border-slate-200 bg-white p-4">
                    <h3 className="font-medium text-slate-900">{section.title}</h3>
                    {section.paragraphs.map((paragraph, paragraphIndex) => (
                      <p key={`${section.title}-p-${paragraphIndex}`} className="mt-2 text-sm text-slate-700">{paragraph}</p>
                    ))}
                    {section.bullets.length ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                        {section.bullets.map((bullet, bulletIndex) => (
                          <li key={`${section.title}-b-${bulletIndex}`}>{bullet}</li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>
            </Panel>
          ) : null}


          {state.reportModel?.recommendations.length ? (
            <Panel title="Recommendations">
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                {state.reportModel.recommendations.map((item, index) => (
                  <li key={`recommendation-${index}`}>{item}</li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {state.payloadError ? (
            <ErrorBanner
              title="Report data unavailable"
              message={state.payloadError}
              requestId={state.requestId}
              action={<button type="button" onClick={() => setRetryToken((value) => value + 1)} className="inline-flex rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50">Refresh</button>}
            />
          ) : null}

          <details className="rounded-2xl border border-slate-200 bg-white p-4" data-testid="report-debug-accordion">
            <summary className="cursor-pointer text-sm font-medium text-slate-700">Debug</summary>
            <div className="mt-3">
              {state.reportPayload ? (
                <pre data-testid="report-json-debug" className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">{JSON.stringify(state.reportPayload, null, 2)}</pre>
              ) : (
                <p className="text-xs text-slate-500">No JSON payload loaded.</p>
              )}
            </div>
          </details>

          {state.report.artifactUrl ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void loadPdf("open")}
                  disabled={artifactState.kind === "loading"}
                  className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {artifactState.kind === "loading" ? "Loading PDF…" : "Open PDF"}
                </button>
                <button
                  type="button"
                  onClick={() => void loadPdf("download")}
                  disabled={artifactState.kind === "loading"}
                  className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Download PDF
                </button>
              </div>
              {artifactState.kind === "session_expired" ? <p className="text-sm text-amber-700">Session expired — log in again.</p> : null}
              {artifactState.kind === "error" ? <p className="text-xs text-rose-600">{artifactState.message}</p> : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {state.view === "invalid_link" ? (
        <section className="space-y-3" data-testid="report-invalid-link">
          <h1 className="text-2xl font-semibold">Invalid report link</h1>
          <p className="text-slate-400">This report link is invalid. Please return to Reports and choose a valid report.</p>
          <Link href="/app/report" className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100">Back to Reports</Link>
        </section>
      ) : null}

      {state.view === "not_found" ? (
        <section className="space-y-3" data-testid="report-not-found">
          <h1 className="text-2xl font-semibold">Report not found</h1>
          <p className="text-slate-400">We could not find a report with ID {reportId}. It may have been deleted or never existed.</p>
          <Link href="/app/report" className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100">Back to Reports</Link>
        </section>
      ) : null}

      {state.view === "forbidden" ? <NotEntitledCallout /> : null}
      {state.view === "session_expired" ? <SessionExpiredCallout requestId={state.requestId} /> : null}
      {state.view === "server_error" ? (
        <div data-testid="report-error">
          <ErrorBanner
            title="Report unavailable"
            message="We could not load this report right now. Please try again shortly."
            requestId={state.requestId}
            action={<button type="button" onClick={() => { setState(initialState); setRetryToken((value) => value + 1); }} className="inline-flex rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50">Retry</button>}
          />
        </div>
      ) : null}
    </FeatureGuard>
  );
}
