"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FeatureGuard } from "../../../_components/feature-guard";
import { NotEntitledCallout, SessionExpiredCallout } from "../../../_components/gate-callouts";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { getReport, type ReportDetail } from "@/src/lib/api/reports";
import { getReportViewState, getRequestId, getStatusCode, type ReportViewState } from "@/src/lib/report/detail-state";

type ReportPageState = {
  view: ReportViewState;
  report: ReportDetail | null;
  requestId?: string;
  statusCode?: number;
};

const DEBUG_REPORTS = process.env.NEXT_PUBLIC_DEBUG_REPORTS === "1";

const initialState: ReportPageState = {
  view: "loading",
  report: null,
};

export default function ReportPage({ params }: { params: { reportId: string } }) {
  const { reportId } = params;
  const [state, setState] = useState<ReportPageState>(initialState);

  useEffect(() => {
    let cancelled = false;

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
          statusCode: getStatusCode(error),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [reportId]);

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
            <Link
              href={state.report.artifactUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100"
            >
              Download/Open PDF
            </Link>
          ) : null}
        </section>
      ) : null}

      {state.view === "not_found" ? (
        <section className="space-y-3" data-testid="report-not-found">
          <h1 className="text-2xl font-semibold">Report not found</h1>
          <p className="text-slate-400">We could not find a report with ID {reportId}. It may have been deleted or never existed.</p>
          {DEBUG_REPORTS ? (
            <p className="text-xs text-slate-500" data-testid="report-debug-line">
              debug: attempted reportId={reportId}, backend status={state.statusCode ?? "unknown"}
            </p>
          ) : null}
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
