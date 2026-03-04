"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import Link from "next/link";
import { FeatureGuard } from "../../../_components/feature-guard";
import { NotEntitledCallout, SessionExpiredCallout } from "../../../_components/gate-callouts";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { getReport, type ReportDetail } from "@/src/lib/api/reports";
import { ApiError, getApiBaseOrigin } from "@/src/lib/api/client";
import { getReportViewState, getRequestId, type ReportViewState } from "@/src/lib/report/detail-state";

type ReportPageState = {
  view: ReportViewState;
  report: ReportDetail | null;
  requestId?: string;
};

const initialState: ReportPageState = {
  view: "loading",
  report: null,
};


type ArtifactLoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; message: string }
  | { kind: "session_expired"; message: string; requestId?: string }
  | { kind: "error"; message: string; requestId?: string };

export function ReportDetailClient({ reportId }: { reportId: string }) {
  const [state, setState] = useState<ReportPageState>(initialState);
  const [retryToken, setRetryToken] = useState(0);
  const [artifactState, setArtifactState] = useState<ArtifactLoadState>({ kind: "idle" });

  useEffect(() => {
    let cancelled = false;
    setArtifactState({ kind: "idle" });

    getReport(reportId)
      .then((report) => {
        if (cancelled) {
          return;
        }

        setState({
          view: "success",
          report,
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setState({
          view: getReportViewState(error),
          report: null,
          requestId: getRequestId(error),
        });
      });

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

      const origin = getApiBaseOrigin();
      const response = await fetch(new URL(artifactUrl, origin).toString(), {
        method: "GET",
        headers: {
          Accept: "application/pdf, application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setArtifactState({
          kind: "session_expired",
          message: "Session expired — log in again.",
          requestId: response.headers.get("x-request-id") ?? undefined,
        });
        return;
      }

      if (!response.ok) {
        throw new ApiError({
          status: response.status,
          code: `HTTP_${response.status}`,
          message: `Unable to load report artifact (status ${response.status}).`,
          requestId: response.headers.get("x-request-id") ?? undefined,
          operation: "report.artifact",
          path: artifactUrl,
          method: "GET",
        });
      }

      const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
      if (contentType.includes("application/pdf")) {
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
        setArtifactState({ kind: "success", message: "Opened PDF in a new tab." });
        return;
      }

      if (contentType.includes("application/json") || contentType.includes("+json")) {
        await response.json();
        setArtifactState({ kind: "success", message: "Report data loaded." });
        return;
      }

      setArtifactState({ kind: "success", message: "Report file loaded." });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setArtifactState({
          kind: "session_expired",
          message: "Session expired — log in again.",
          requestId: error.requestId,
        });
        return;
      }

      setArtifactState({
        kind: "error",
        message: "Unable to open report artifact right now. Please try again.",
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
            <div>
              <dt className="text-slate-600">Report ID</dt>
              <dd>{state.report.id}</dd>
            </div>
            <div>
              <dt className="text-slate-600">Status</dt>
              <dd>{state.report.status}</dd>
            </div>
            {state.report.createdAt ? (
              <div>
                <dt className="text-slate-600">Created at</dt>
                <dd>{state.report.createdAt}</dd>
              </div>
            ) : null}
            {state.report.updatedAt ? (
              <div>
                <dt className="text-slate-600">Updated at</dt>
                <dd>{state.report.updatedAt}</dd>
              </div>
            ) : null}
            {state.report.artifactUrl ? (
              <div>
                <dt className="text-slate-600">Artifact kind</dt>
                <dd>{state.report.artifactKind ?? "report"}</dd>
              </div>
            ) : null}
          </dl>
          <p className="text-slate-400">{state.report.summary}</p>
          {state.report.artifactUrl ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => void openArtifact()}
                disabled={artifactState.kind === "loading"}
                className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {artifactState.kind === "loading" ? "Loading report…" : "Download/Open report"}
              </button>
              {artifactState.kind === "success" ? <p className="text-xs text-slate-500">{artifactState.message}</p> : null}
              {artifactState.kind === "session_expired" ? (
                <div className="space-y-1 text-sm text-amber-700" data-testid="report-artifact-session-expired">
                  <p>{artifactState.message}</p>
                  {artifactState.requestId ? <p className="text-xs text-slate-500">request_id: {artifactState.requestId}</p> : null}
                  <Link href="/login" className="inline-flex rounded-lg border border-amber-200 px-3 py-1.5 text-xs hover:bg-amber-50">
                    Log in again
                  </Link>
                </div>
              ) : null}
              {artifactState.kind === "error" ? (
                <p className="text-xs text-rose-600">
                  {artifactState.message}
                  {artifactState.requestId ? ` request_id: ${artifactState.requestId}` : ""}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {state.view === "invalid_link" ? (
        <section className="space-y-3" data-testid="report-invalid-link">
          <h1 className="text-2xl font-semibold">Invalid report link</h1>
          <p className="text-slate-400">This report link is invalid. Please return to Reports and choose a valid report.</p>
          <Link href="/app/report" className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100">
            Back to Reports
          </Link>
        </section>
      ) : null}

      {state.view === "not_found" ? (
        <section className="space-y-3" data-testid="report-not-found">
          <h1 className="text-2xl font-semibold">Report not found</h1>
          <p className="text-slate-400">We could not find a report with ID {reportId}. It may have been deleted or never existed.</p>
          {state.requestId ? <p className="text-xs text-slate-500">request_id: {state.requestId}</p> : null}
          <Link href="/app/report" className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100">
            Back to Reports
          </Link>
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
            action={
              <button
                type="button"
                onClick={() => {
                  setState(initialState);
                  setRetryToken((value) => value + 1);
                }}
                className="inline-flex rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50"
              >
                Retry
              </button>
            }
          />
        </div>
      ) : null}
    </FeatureGuard>
  );
}
