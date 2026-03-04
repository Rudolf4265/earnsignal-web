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

type ReportPageState = {
  view: ReportViewState;
  report: ReportDetail | null;
  reportPayload: Record<string, unknown> | null;
  payloadError?: string;
  requestId?: string;
};

const initialState: ReportPageState = {
  view: "loading",
  report: null,
  reportPayload: null,
};

type ArtifactLoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; message: string }
  | { kind: "session_expired"; message: string; requestId?: string }
  | { kind: "error"; message: string; requestId?: string };

function renderReportPayload(payload: Record<string, unknown>) {
  const sections = Array.isArray(payload.sections) ? payload.sections : [];

  if (sections.length > 0) {
    return (
      <div className="space-y-3" data-testid="report-json-sections">
        {sections.map((section, index) => {
          const record = section && typeof section === "object" ? (section as Record<string, unknown>) : {};
          const heading = typeof record.title === "string" ? record.title : `Section ${index + 1}`;
          return (
            <article key={`${heading}-${index}`} className="rounded-lg border border-slate-200 bg-white p-3">
              <h3 className="font-medium text-slate-900">{heading}</h3>
              <pre className="mt-2 overflow-x-auto text-xs text-slate-700">{JSON.stringify(record, null, 2)}</pre>
            </article>
          );
        })}
      </div>
    );
  }

  return <pre data-testid="report-json-fallback" className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-3 text-xs">{JSON.stringify(payload, null, 2)}</pre>;
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
              payloadError: "Available after first report",
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
            });
          }
          return;
        }

        const payload = await fetchReportJsonArtifact({ artifactJsonUrl: jsonUrl, token, origin: getApiBaseOrigin() });

        if (!cancelled) {
          setState({
            view: "success",
            report,
            reportPayload: payload,
          });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState({
          view: getReportViewState(error),
          report: null,
          reportPayload: null,
          requestId: getRequestId(error),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reportId, retryToken]);

  async function openArtifact() {
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
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      setArtifactState({ kind: "success", message: "Opened PDF in a new tab." });
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
          : "Unable to open report PDF right now. Please try again.";

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
          <h1 className="text-2xl font-semibold">{state.report.title}</h1>
          <dl className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <div><dt className="text-slate-600">Report ID</dt><dd>{state.report.id}</dd></div>
            <div><dt className="text-slate-600">Status</dt><dd>{state.report.status}</dd></div>
          </dl>
          <p className="text-slate-400">{state.report.summary}</p>

          {state.reportPayload ? renderReportPayload(state.reportPayload) : null}
          {state.payloadError ? (
            <ErrorBanner
              title="Report data unavailable"
              message={state.payloadError}
              action={<button type="button" onClick={() => setRetryToken((value) => value + 1)} className="inline-flex rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50">Retry</button>}
            />
          ) : null}

          {state.report.artifactUrl ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => void openArtifact()}
                disabled={artifactState.kind === "loading"}
                className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {artifactState.kind === "loading" ? "Loading PDF…" : "Open PDF"}
              </button>
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
