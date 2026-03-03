"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FeatureGuard } from "../../_components/feature-guard";
import { NotEntitledCallout, SessionExpiredCallout } from "../../_components/gate-callouts";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { isApiError } from "@/src/lib/api/client";
import { listReports, type ReportListItem } from "@/src/lib/api/reports";

type ReportsViewState = "loading" | "success" | "empty" | "session_expired" | "not_entitled" | "error";

type ReportsPageState = {
  view: ReportsViewState;
  items: ReportListItem[];
  nextOffset: number;
  hasMore: boolean;
  requestId?: string;
};

const PAGE_SIZE = 25;

const initialState: ReportsPageState = {
  view: "loading",
  items: [],
  nextOffset: 0,
  hasMore: false,
};

function compareByCreatedAtDesc(a: ReportListItem, b: ReportListItem): number {
  const aTime = new Date(a.created_at).getTime();
  const bTime = new Date(b.created_at).getTime();
  return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
}

function toViewState(error: unknown): ReportsViewState {
  if (isApiError(error)) {
    if (error.status === 401) {
      return "session_expired";
    }

    if (error.status === 403) {
      return "not_entitled";
    }
  }

  return "error";
}

function getRequestId(error: unknown): string | undefined {
  if (isApiError(error)) {
    return error.requestId;
  }

  return undefined;
}

function statusLabel(status: ReportListItem["status"]): string {
  if (status === "queued") return "Queued";
  if (status === "running") return "Running";
  if (status === "failed") return "Failed";
  return "Ready";
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function ReportsPage() {
  const [state, setState] = useState<ReportsPageState>(initialState);
  const [loadingMore, setLoadingMore] = useState(false);

  const sortedItems = useMemo(() => [...state.items].sort(compareByCreatedAtDesc), [state.items]);

  const loadReports = async ({ append }: { append: boolean }) => {
    const targetOffset = append ? state.nextOffset : 0;

    if (!append) {
      setState((prev) => ({
        ...prev,
        view: "loading",
      }));
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await listReports({ limit: PAGE_SIZE, offset: targetOffset });
      const mergedItems = append ? [...state.items, ...response.items] : response.items;
      const deduped = Array.from(new Map(mergedItems.map((item) => [item.report_id, item])).values());
      const view: ReportsViewState = deduped.length > 0 ? "success" : "empty";

      setState({
        view,
        items: deduped,
        nextOffset: response.next_offset,
        hasMore: response.has_more,
      });
    } catch (error) {
      if (append) {
        setState((prev) => ({
          ...prev,
          view: prev.items.length > 0 ? "success" : "error",
          requestId: getRequestId(error),
        }));
      } else {
        setState({
          view: toViewState(error),
          items: [],
          nextOffset: 0,
          hasMore: false,
          requestId: getRequestId(error),
        });
      }
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    void loadReports({ append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FeatureGuard feature="report">
      <div className="space-y-5">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
          <p className="text-slate-600">Choose a report to review analysis details.</p>
        </div>

        {state.view === "loading" ? (
          <div className="space-y-3" data-testid="reports-loading">
            <div className="h-16 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
            <div className="h-16 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
          </div>
        ) : null}

        {state.view === "session_expired" ? <SessionExpiredCallout requestId={state.requestId} /> : null}

        {state.view === "not_entitled" ? <NotEntitledCallout /> : null}

        {state.view === "error" ? (
          <ErrorBanner
            data-testid="reports-error"
            title="Reports unavailable"
            message="We could not load your reports right now. Please try again."
            requestId={state.requestId}
            action={
              <button
                type="button"
                onClick={() => void loadReports({ append: false })}
                className="inline-flex rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50"
              >
                Retry
              </button>
            }
          />
        ) : null}

        {state.view === "empty" ? (
          <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4" data-testid="reports-empty">
            <h2 className="text-lg font-medium text-slate-900">No reports yet</h2>
            <p className="text-sm text-slate-600">Upload data to generate your first report.</p>
            <Link href="/app/data" className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100">
              Go to Data Upload
            </Link>
          </section>
        ) : null}

        {state.view === "success" ? (
          <section className="space-y-3" data-testid="reports-list">
            {sortedItems.map((report) => {
              const primaryHref = report.artifact_url || `/app/report/${encodeURIComponent(report.report_id)}`;
              const isReady = report.status === "ready";

              return (
                <article key={report.report_id} className="rounded-lg border border-slate-200 bg-white p-4" data-testid="report-row">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h2 className="font-semibold text-slate-900">{report.title || "Report"}</h2>
                      <p className="text-sm text-slate-600">Created {formatTimestamp(report.created_at)}</p>
                      {report.coverage_start && report.coverage_end ? (
                        <p className="text-xs text-slate-500">Coverage: {report.coverage_start} to {report.coverage_end}</p>
                      ) : null}
                      {report.platforms ? <p className="text-xs text-slate-500">Platforms: {report.platforms.join(", ")}</p> : null}
                    </div>
                    <span className="rounded-full border border-slate-300 px-2 py-1 text-xs text-slate-700" data-testid={`report-status-${report.report_id}`}>
                      {statusLabel(report.status)}
                    </span>
                  </div>
                  <div className="mt-3">
                    {isReady ? (
                      <Link
                        href={primaryHref}
                        target={report.artifact_url ? "_blank" : undefined}
                        rel={report.artifact_url ? "noreferrer" : undefined}
                        className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100"
                      >
                        View
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex cursor-not-allowed rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500"
                      >
                        {report.status === "failed" ? "Failed" : "Processing"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}

            {state.hasMore ? (
              <button
                type="button"
                onClick={() => void loadReports({ append: true })}
                disabled={loadingMore}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            ) : null}
          </section>
        ) : null}

        {(state.view === "empty" || state.view === "success") ? (
          <Link href="/app/report/demo" className="inline-block rounded-lg border border-slate-200 bg-white px-4 py-2 transition hover:bg-slate-100">
            Open sample report
          </Link>
        ) : null}
      </div>
    </FeatureGuard>
  );
}
