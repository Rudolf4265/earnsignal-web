"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FeatureGuard } from "../../../_components/feature-guard";
import { SessionExpiredCallout } from "../../../_components/gate-callouts";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { fetchReportDetail, fetchReportPdfBlobUrl, getReportErrorMessage, type ReportDetail } from "@/src/lib/api/reports";
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
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

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

  const openPdf = async () => {
    if (!state.report || pdfLoading) {
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

  return (
    <FeatureGuard feature="report">
      {state.view === "loading" ? (
        <div className="space-y-3" data-testid="report-loading">
          <h1 className="text-2xl font-semibold">Loading report...</h1>
          <p className="text-sm text-slate-400">Fetching report details for {id}.</p>
        </div>
      ) : null}

      {state.view === "success" && state.report ? (
        <section className="space-y-4" data-testid="report-content">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold">{state.report.title}</h1>
            <button
              type="button"
              onClick={() => void openPdf()}
              disabled={pdfLoading}
              className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pdfLoading ? "Opening PDF..." : "Open PDF"}
            </button>
          </div>

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
          </dl>
          <p className="text-slate-600">{state.report.summary}</p>
          {pdfError ? <p className="text-sm text-rose-700">PDF unavailable: {pdfError}</p> : null}
        </section>
      ) : null}

      {state.view === "not_found" ? (
        <section className="space-y-3" data-testid="report-not-found">
          <h1 className="text-2xl font-semibold">Report not found</h1>
          <p className="text-slate-400">We could not find a report with ID {id}. It may have been deleted or never existed.</p>
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
