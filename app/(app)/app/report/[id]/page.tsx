"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FeatureGuard } from "../../../_components/feature-guard";
import { SessionExpiredCallout } from "../../../_components/gate-callouts";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { fetchReportDetail, type ReportDetail } from "@/src/lib/api/reports";
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

export default function ReportPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [state, setState] = useState<ReportPageState>(initialState);

  useEffect(() => {
    let cancelled = false;

    fetchReportDetail(id)
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
  }, [id]);

  return (
    <FeatureGuard feature="report">
      {state.view === "loading" ? (
        <div className="space-y-3" data-testid="report-loading">
          <h1 className="text-2xl font-semibold">Loading report…</h1>
          <p className="text-sm text-gray-300">Fetching report details for {id}.</p>
        </div>
      ) : null}

      {state.view === "success" && state.report ? (
        <section className="space-y-4" data-testid="report-content">
          <h1 className="text-2xl font-semibold">{state.report.title}</h1>
          <dl className="grid grid-cols-1 gap-3 text-sm text-gray-200 sm:grid-cols-2">
            <div>
              <dt className="text-gray-400">Report ID</dt>
              <dd>{state.report.id}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Status</dt>
              <dd>{state.report.status}</dd>
            </div>
            {state.report.createdAt ? (
              <div>
                <dt className="text-gray-400">Created at</dt>
                <dd>{state.report.createdAt}</dd>
              </div>
            ) : null}
            {state.report.updatedAt ? (
              <div>
                <dt className="text-gray-400">Updated at</dt>
                <dd>{state.report.updatedAt}</dd>
              </div>
            ) : null}
          </dl>
          <p className="text-gray-300">{state.report.summary}</p>
        </section>
      ) : null}

      {state.view === "not_found" ? (
        <section className="space-y-3" data-testid="report-not-found">
          <h1 className="text-2xl font-semibold">Report not found</h1>
          <p className="text-gray-300">We could not find a report with ID {id}. It may have been deleted or never existed.</p>
          <Link href="/app/report" className="inline-flex rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/10">
            Back to Reports
          </Link>
        </section>
      ) : null}

      {state.view === "forbidden" ? (
        <section className="space-y-3" data-testid="report-forbidden">
          <h1 className="text-2xl font-semibold">Unauthorized access</h1>
          <p className="text-gray-300">You do not have permission to view this report.</p>
          <Link href="/app" className="inline-flex rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/10">
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
              <Link href="/app/report" className="inline-flex rounded-lg border border-rose-200/60 px-3 py-1.5 text-xs hover:bg-rose-300/10">
                Back to Reports
              </Link>
            }
          />
        </div>
      ) : null}
    </FeatureGuard>
  );
}
