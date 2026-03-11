"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "../_components/dashboard/Badge";
import { EmptyState } from "../_components/dashboard/EmptyState";
import { Panel } from "../_components/dashboard/Panel";
import { SkeletonBlock } from "../../_components/ui/skeleton";
import { FeatureGuard } from "../../_components/feature-guard";
import { useEntitlementState } from "../../_components/use-entitlement-state";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { Button, buttonClassName } from "@/src/components/ui/button";
import { PageHeader } from "@/src/components/ui/page-header";
import { isApiError, isEntitlementRequiredError } from "@/src/lib/api/client";
import { downloadReportArtifactPdf, fetchReportsList, getReportErrorMessage, type ReportListItem } from "@/src/lib/api/reports";
import { toReportListRows, type ReportListRow } from "@/src/lib/report/list-model";

type ReportsState = {
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  entitlementRequired: boolean;
  requestId?: string;
  items: ReportListItem[];
  nextOffset: number | null;
  hasMore: boolean;
};

const initialState: ReportsState = {
  loading: true,
  loadingMore: false,
  error: null,
  entitlementRequired: false,
  requestId: undefined,
  items: [],
  nextOffset: null,
  hasMore: false,
};

function reportCountLabel(count: number): string {
  if (count === 0) {
    return "No reports to display yet.";
  }

  if (count === 1) {
    return "Showing 1 recent report.";
  }

  return `Showing ${count} recent reports.`;
}

export default function ReportsPage() {
  const entitlementState = useEntitlementState();
  const [state, setState] = useState<ReportsState>(initialState);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadEntitlementRequired, setDownloadEntitlementRequired] = useState(false);
  const [downloadRequestId, setDownloadRequestId] = useState<string | undefined>(undefined);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);

  const reportRows = useMemo(() => toReportListRows(state.items), [state.items]);
  const listDescription = useMemo(() => reportCountLabel(reportRows.length), [reportRows.length]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialPage() {
      setState({
        loading: true,
        loadingMore: false,
        error: null,
        entitlementRequired: false,
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
          entitlementRequired: false,
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
          error: getReportErrorMessage(error),
          entitlementRequired: isEntitlementRequiredError(error),
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
      entitlementRequired: false,
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
        error: getReportErrorMessage(error),
        entitlementRequired: isEntitlementRequiredError(error),
        requestId: isApiError(error) ? error.requestId : undefined,
      }));
    }
  }, [state.hasMore, state.loading, state.loadingMore, state.nextOffset]);

  const handleDownload = useCallback(
    async (row: ReportListRow) => {
      if (!row.canDownload || !entitlementState.canDownloadPdf || !row.reportId || !row.artifactUrl || downloadingReportId) {
        return;
      }

      setDownloadError(null);
      setDownloadEntitlementRequired(false);
      setDownloadRequestId(undefined);
      setDownloadingReportId(row.reportId);

      try {
        await downloadReportArtifactPdf({
          reportId: row.reportId,
          title: row.title,
          artifactUrl: row.artifactUrl,
        });
      } catch (error) {
        setDownloadError(getReportErrorMessage(error));
        setDownloadEntitlementRequired(isEntitlementRequiredError(error));
        setDownloadRequestId(isApiError(error) ? error.requestId : undefined);
      } finally {
        setDownloadingReportId(null);
      }
    },
    [downloadingReportId, entitlementState.canDownloadPdf],
  );

  return (
    <FeatureGuard feature="report">
      <div className="space-y-6">
        <PageHeader
          title="Reports"
          subtitle="Review generated analyses, statuses, and report artifacts."
          actions={
            <Link href="/app/data" className={buttonClassName({ variant: "primary" })}>
              Upload
            </Link>
          }
        />

        {state.error ? (
          <ErrorBanner
            title="Report list unavailable"
            message={state.error}
            requestId={state.requestId}
            onRetry={retryLoad}
            action={
              state.entitlementRequired ? (
                <Link href="/app/billing" className={buttonClassName({ variant: "secondary", size: "sm" })}>
                  Go to Billing
                </Link>
              ) : undefined
            }
          />
        ) : null}
        {downloadError ? (
          <ErrorBanner
            title="Report download unavailable"
            message={downloadError}
            requestId={downloadRequestId}
            retryLabel="Dismiss"
            onRetry={() => {
              setDownloadError(null);
              setDownloadEntitlementRequired(false);
              setDownloadRequestId(undefined);
            }}
            action={
              downloadEntitlementRequired ? (
                <Link href="/app/billing" className={buttonClassName({ variant: "secondary", size: "sm" })}>
                  Go to Billing
                </Link>
              ) : undefined
            }
          />
        ) : null}

        <Panel title="Recent Reports" description={listDescription}>
          {state.loading ? (
            <div className="overflow-hidden rounded-2xl border border-brand-border" data-testid="report-list-loading">
              <div className="grid grid-cols-[minmax(14rem,1.8fr)_9rem_minmax(15rem,1fr)] bg-brand-panel-muted/80 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-text-muted">
                <span>Date</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="grid grid-cols-[minmax(14rem,1.8fr)_9rem_minmax(15rem,1fr)] items-center border-t border-brand-border bg-brand-panel px-4 py-3">
                  <div className="space-y-2">
                    <SkeletonBlock className="h-4 w-40" />
                    <SkeletonBlock className="h-3 w-28" />
                  </div>
                  <SkeletonBlock className="h-6 w-20 rounded-full" />
                  <div className="ml-auto flex gap-2">
                    <SkeletonBlock className="h-8 w-16" />
                    <SkeletonBlock className="h-8 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : reportRows.length > 0 ? (
            <div className="space-y-3">
              <div
                className="overflow-hidden rounded-2xl border border-brand-border"
                data-testid="report-list"
                aria-label="Report list table"
              >
                <div className="grid grid-cols-[minmax(14rem,1.8fr)_9rem_minmax(15rem,1fr)] bg-brand-panel-muted/80 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-text-muted">
                  <span>Date</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>

                {reportRows.map((row) => {
                  const canOfferPdfDownload = row.canDownload && entitlementState.canDownloadPdf;
                  const downloadTooltip = row.canDownload ? "Upgrade to Pro to download PDF" : "PDF not available yet";

                  return (
                    <div
                      key={row.id}
                      className="grid grid-cols-[minmax(14rem,1.8fr)_9rem_minmax(15rem,1fr)] items-center border-t border-brand-border bg-brand-panel px-4 py-3 transition hover:bg-brand-panel-muted/70"
                    >
                      <div className="min-w-[12rem] pr-4">
                        <p className="text-sm font-semibold text-brand-text-primary">{row.title}</p>
                        <p className="mt-1 text-xs text-brand-text-muted">{row.createdAtLabel}</p>
                      </div>

                      <div>
                        <Badge variant={row.statusVariant}>{row.statusLabel}</Badge>
                      </div>

                      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                        {row.canView && row.viewHref ? (
                          <Link href={row.viewHref} className={buttonClassName({ variant: "primary", size: "sm" })}>
                            View
                          </Link>
                        ) : (
                          <span className="inline-flex rounded-full border border-amber-300/35 bg-amber-300/15 px-3 py-1.5 text-xs font-medium text-amber-100">
                            Unavailable
                          </span>
                        )}

                        {canOfferPdfDownload ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => void handleDownload(row)}
                            disabled={Boolean(downloadingReportId)}
                          >
                            {downloadingReportId === row.reportId ? "Downloading..." : "Download PDF"}
                          </Button>
                        ) : (
                          <div className="group relative">
                            <button
                              type="button"
                              disabled
                              className={buttonClassName({
                                variant: "secondary",
                                size: "sm",
                                className: "border-brand-border text-brand-text-muted",
                              })}
                              aria-describedby={`report-tooltip-${row.id}`}
                            >
                              Download PDF
                            </button>
                            <div
                              id={`report-tooltip-${row.id}`}
                              role="tooltip"
                              className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-10 w-max -translate-x-1/2 rounded-md border border-brand-border bg-brand-bg-elevated px-2 py-1 text-[11px] text-brand-text-secondary opacity-0 shadow-brand-card transition group-hover:opacity-100 group-focus-within:opacity-100"
                            >
                              {downloadTooltip}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {state.hasMore ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-brand-text-muted">Showing the most recent page of reports.</p>
                  <Button type="button" variant="secondary" size="sm" onClick={() => void loadMore()} disabled={state.loadingMore}>
                    {state.loadingMore ? "Loading..." : "Load more"}
                  </Button>
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
