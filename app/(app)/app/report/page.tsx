"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "../_components/dashboard/Badge";
import { EmptyState } from "../_components/dashboard/EmptyState";
import { Panel } from "../_components/dashboard/Panel";
import { SkeletonBlock } from "../../_components/ui/skeleton";
import { FeatureGuard } from "../../_components/feature-guard";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { isApiError } from "@/src/lib/api/client";
import { downloadReportArtifactPdf, fetchReportsList, getReportErrorMessage, type ReportListItem } from "@/src/lib/api/reports";
import { toReportListRows, type ReportListRow } from "@/src/lib/report/list-model";

type ReportsState = {
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  requestId?: string;
  items: ReportListItem[];
  nextOffset: number | null;
  hasMore: boolean;
};

const initialState: ReportsState = {
  loading: true,
  loadingMore: false,
  error: null,
  requestId: undefined,
  items: [],
  nextOffset: null,
  hasMore: false,
};

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load reports.";
}

export default function ReportsPage() {
  const [state, setState] = useState<ReportsState>(initialState);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadRequestId, setDownloadRequestId] = useState<string | undefined>(undefined);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);

  const reportRows = useMemo(() => toReportListRows(state.items), [state.items]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialPage() {
      setState({
        loading: true,
        loadingMore: false,
        error: null,
        requestId: undefined,
        items: [],
        nextOffset: null,
        hasMore: false,
      });

      try {
        const page = await fetchReportsList();

        if (cancelled) {
          return;
        }

        setState({
          loading: false,
          loadingMore: false,
          error: null,
          requestId: undefined,
          items: page.items,
          nextOffset: page.nextOffset,
          hasMore: page.hasMore,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setState({
          loading: false,
          loadingMore: false,
          error: toErrorMessage(error),
          requestId: isApiError(error) ? error.requestId : undefined,
          items: [],
          nextOffset: null,
          hasMore: false,
        });
      }
    }

    void loadInitialPage();

    return () => {
      cancelled = true;
    };
  }, [reloadNonce]);

  const retryLoad = useCallback(() => {
    setReloadNonce((prev) => prev + 1);
  }, []);

  const loadMore = useCallback(async () => {
    if (state.loading || state.loadingMore || !state.hasMore || state.nextOffset === null) {
      return;
    }

    setState((prev) => ({
      ...prev,
      loadingMore: true,
      error: null,
      requestId: undefined,
    }));

    try {
      const page = await fetchReportsList(state.nextOffset);
      setState((prev) => ({
        ...prev,
        loadingMore: false,
        items: [...prev.items, ...page.items],
        nextOffset: page.nextOffset,
        hasMore: page.hasMore,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loadingMore: false,
        error: toErrorMessage(error),
        requestId: isApiError(error) ? error.requestId : undefined,
      }));
    }
  }, [state.hasMore, state.loading, state.loadingMore, state.nextOffset]);

  const handleDownload = useCallback(async (row: ReportListRow) => {
    if (!row.canDownload || !row.artifactUrl || downloadingReportId) {
      return;
    }

    setDownloadError(null);
    setDownloadRequestId(undefined);
    setDownloadingReportId(row.id);

    try {
      await downloadReportArtifactPdf({
        reportId: row.id,
        title: row.title,
        artifactUrl: row.artifactUrl,
      });
    } catch (error) {
      setDownloadError(getReportErrorMessage(error));
      setDownloadRequestId(isApiError(error) ? error.requestId : undefined);
    } finally {
      setDownloadingReportId(null);
    }
  }, [downloadingReportId]);

  return (
    <FeatureGuard feature="report">
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
          <p className="mt-1 text-slate-600">Choose a report to review analysis details.</p>
        </header>

        {state.error ? <ErrorBanner title="Report list unavailable" message={state.error} requestId={state.requestId} onRetry={retryLoad} /> : null}
        {downloadError ? (
          <ErrorBanner
            title="Report download unavailable"
            message={downloadError}
            requestId={downloadRequestId}
            retryLabel="Dismiss"
            onRetry={() => {
              setDownloadError(null);
              setDownloadRequestId(undefined);
            }}
          />
        ) : null}

        <Panel
          title="Recent Reports"
          description="Generated analyses and processing status."
          rightSlot={
            <Link
              href="/app/data"
              className="inline-flex rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Upload
            </Link>
          }
        >
          {state.loading ? (
            <div className="space-y-2" data-testid="report-list-loading">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="flex-1 space-y-2">
                    <SkeletonBlock className="h-4 w-40" />
                    <SkeletonBlock className="h-3 w-32" />
                  </div>
                  <SkeletonBlock className="h-6 w-24" />
                  <SkeletonBlock className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : reportRows.length > 0 ? (
            <div className="space-y-2" data-testid="report-list">
              {reportRows.map((row) => (
                <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="min-w-[12rem] flex-1">
                    <p className="text-sm font-semibold text-slate-900">{row.title}</p>
                    <p className="mt-1 text-xs text-slate-600">{row.createdAtLabel}</p>
                  </div>
                  <Badge variant={row.statusVariant}>{row.statusLabel}</Badge>
                  <div className="flex items-center gap-2">
                    <Link
                      href={row.viewHref}
                      className="inline-flex rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      View
                    </Link>
                    {row.canDownload ? (
                      <button
                        type="button"
                        onClick={() => void handleDownload(row)}
                        disabled={Boolean(downloadingReportId)}
                        className="inline-flex rounded-xl bg-brand-blue px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {downloadingReportId === row.id ? "Downloading..." : "Download PDF"}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}

              {state.hasMore ? (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => void loadMore()}
                    disabled={state.loadingMore}
                    className="inline-flex rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {state.loadingMore ? "Loading..." : "Load more"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState title="No reports yet" body="Upload data to generate your first report." ctaLabel="Upload" ctaHref="/app/data" />
          )}
        </Panel>
      </div>
    </FeatureGuard>
  );
}
