"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import UploadStepper from "./upload-stepper";
import { SkeletonBlock } from "../../../_components/ui/skeleton";
import { buttonClassName } from "@/src/components/ui/button";
import { StatusPill } from "@/src/components/ui/status-pill";
import { TrustMicrocopy, UPLOAD_TRUST_MICROCOPY_BODY } from "@/src/components/ui/trust-microcopy";
import { createReportRun, getReportErrorMessage } from "@/src/lib/api/reports";
import { clearWorkspaceData, fetchWorkspaceDataSources, type WorkspaceDataSourcesResponse } from "@/src/lib/api/workspace";
import { getSourceManifest, type UploadPlatform } from "@/src/lib/api/upload";
import { buildWorkspaceReportState } from "@/src/lib/workspace/report-run-state";
import {
  buildSourceListItems,
  getPrimarySourceStatusLabel,
  getPrimarySourceStatusVariant,
  type SourceListAction,
  type SourceListItem,
} from "@/src/lib/workspace/source-display";
import {
  buildUploadPlatformCardsFromManifest,
  normalizeSourceManifestResponse,
  type NormalizedSourceManifest,
  type UploadPlatformCardMetadata,
} from "@/src/lib/upload/platform-metadata";

type DataPageHeaderProps = {
  title?: string;
  subtitle?: string;
};

type ReadyToRunBannerProps = {
  loading: boolean;
  ready: boolean;
  statusLabel: string;
  connectedCount: number;
  note: string;
  runDisabled?: boolean;
  onRunReport: () => void;
  onViewReports: () => void;
};

type SourceCardProps = {
  item: SourceListItem;
  onUploadAction: (platform: UploadPlatform) => void;
};

type SourceListSectionProps = {
  items: SourceListItem[];
  loading: boolean;
  sourceManifest: NormalizedSourceManifest | null;
  sourceManifestLoading: boolean;
  visiblePlatformCards: UploadPlatformCardMetadata[] | null;
  workspaceReportState: ReturnType<typeof buildWorkspaceReportState>;
  refreshWorkspaceDataSources: () => Promise<void>;
  clearCurrentReport: () => void;
  onReportCreated: (reportId: string) => void;
  onUploadAction: (platform: UploadPlatform) => void;
  preferredPlatform: UploadPlatform | null;
  preferredPlatformNonce: number;
};

function DataPageHeader({
  title = "Your Report Workspace",
  subtitle = "This report uses your staged sources.",
}: DataPageHeaderProps) {
  return (
    <section className="space-y-2">
      <h1 className="text-3xl font-semibold text-white">{title}</h1>
      <p className="max-w-3xl text-sm leading-6 text-slate-300">{subtitle}</p>
    </section>
  );
}

function ReadyToRunBanner({
  loading,
  ready,
  statusLabel,
  connectedCount,
  note,
  runDisabled = false,
  onRunReport,
  onViewReports,
}: ReadyToRunBannerProps) {
  const countLabel = `${connectedCount} ${connectedCount === 1 ? "source" : "sources"} connected`;

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(145deg,rgba(11,24,50,0.96),rgba(14,32,69,0.96),rgba(9,20,43,0.98))] p-5 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.95)] sm:p-6">
      {loading ? (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <SkeletonBlock className="h-7 w-28 bg-white/10" />
            <SkeletonBlock className="h-8 w-52 bg-white/10" />
            <SkeletonBlock className="h-4 w-36 bg-white/10" />
          </div>
          <div className="flex flex-wrap gap-3">
            <SkeletonBlock className="h-11 w-36 bg-white/10" />
            <SkeletonBlock className="h-11 w-32 bg-white/10" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <StatusPill variant={ready ? "good" : connectedCount > 0 ? "warn" : "neutral"}>{statusLabel}</StatusPill>
            <div>
              <h2 className="text-2xl font-semibold text-white">Ready to run</h2>
              <p className="mt-1 text-sm text-slate-300">{countLabel}</p>
            </div>
            <p className="text-xs leading-5 text-slate-400">{note}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              data-testid="staged-run-report"
              onClick={() => void onRunReport()}
              disabled={runDisabled}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-slate-400"
            >
              Run Report
            </button>
            <button
              type="button"
              onClick={onViewReports}
              className={buttonClassName({
                variant: "secondary",
                className: "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.08] hover:text-white",
              })}
            >
              View all reports
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function renderAction(action: SourceListAction | undefined, onUploadAction: (platform: UploadPlatform) => void, secondary = false) {
  if (!action) {
    return null;
  }

  if (action.kind === "link") {
    return (
      <Link
        href={action.href}
        className={
          secondary
            ? "text-sm font-medium text-slate-400 underline underline-offset-4 transition hover:text-white"
            : buttonClassName({
                variant: "secondary",
                size: "sm",
                className: "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:text-white",
              })
        }
      >
        {action.label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onUploadAction(action.platform)}
      className={
        secondary
          ? "text-sm font-medium text-slate-400 underline underline-offset-4 transition hover:text-white"
          : buttonClassName({
              variant: "secondary",
              size: "sm",
              className: "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:text-white",
            })
      }
    >
      {action.label}
    </button>
  );
}

function SourceCard({ item, onUploadAction }: SourceCardProps) {
  return (
    <article
      className="rounded-[1.25rem] border border-white/10 bg-[#0f1d38]/90 p-5"
      data-testid={`workspace-source-card-${item.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{item.name}</h3>
          <p className="mt-1 text-sm text-slate-300">{item.summary}</p>
        </div>
        <StatusPill variant={getPrimarySourceStatusVariant(item.status)}>{getPrimarySourceStatusLabel(item.status)}</StatusPill>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-sm leading-relaxed text-slate-300">{item.note}</p>
        {item.lastUpdatedLabel ? <p className="text-xs text-slate-400">Last updated: {item.lastUpdatedLabel}</p> : null}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        {renderAction(item.primaryAction, onUploadAction)}
        {renderAction(item.secondaryAction, onUploadAction, true)}
      </div>
    </article>
  );
}

function SourceCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={`workspace-source-skeleton-${index + 1}`} className="rounded-[1.25rem] border border-white/10 bg-[#0f1d38]/90 p-5">
          <SkeletonBlock className="h-5 w-28 bg-white/10" />
          <SkeletonBlock className="mt-2 h-4 w-36 bg-white/10" />
          <SkeletonBlock className="mt-6 h-4 w-full bg-white/10" />
          <SkeletonBlock className="mt-2 h-4 w-4/5 bg-white/10" />
          <SkeletonBlock className="mt-6 h-9 w-28 bg-white/10" />
        </div>
      ))}
    </div>
  );
}

function ManifestUnavailableCard() {
  return (
    <section className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-5">
      <div data-testid="source-manifest-unavailable" className="space-y-3">
        <h3 className="text-base font-semibold text-white">Supported sources unavailable</h3>
        <p className="text-sm leading-relaxed text-slate-300">
          The supported source list could not be loaded, so uploads are paused until the manifest is available again.
        </p>
        <Link href="/app/help#upload-guide" className={buttonClassName({ variant: "secondary", size: "sm" })}>
          Open upload guide
        </Link>
      </div>
    </section>
  );
}

function SourceListSection({
  items,
  loading,
  sourceManifest,
  sourceManifestLoading,
  visiblePlatformCards,
  workspaceReportState,
  refreshWorkspaceDataSources,
  clearCurrentReport,
  onReportCreated,
  onUploadAction,
  preferredPlatform,
  preferredPlatformNonce,
}: SourceListSectionProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Your data sources</h2>
          <p className="mt-1 text-sm text-slate-400">Connect, replace, or manage the data used in your report.</p>
        </div>
        <Link href="/app/settings#data-sources" className="text-sm font-medium text-blue-200 underline underline-offset-4 transition hover:text-white">
          Manage details in Settings
        </Link>
      </div>

      {loading ? (
        <SourceCardsSkeleton />
      ) : sourceManifest || visiblePlatformCards ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <SourceCard key={item.id} item={item} onUploadAction={onUploadAction} />
          ))}
        </div>
      ) : (
        <ManifestUnavailableCard />
      )}

      <div id="workspace-uploader" className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Add or replace a source</h3>
            <p className="mt-1 text-sm text-slate-400">Choose a platform, then upload a supported file.</p>
          </div>
          <Link href="/app/help#upload-guide" className="text-sm font-medium text-blue-200 underline underline-offset-4 transition hover:text-white">
            Open upload guide
          </Link>
        </div>

        {sourceManifestLoading ? (
          <div className="rounded-2xl border border-white/10 bg-[#0f1d38]/90 p-5">
            <SkeletonBlock className="h-5 w-44 bg-white/10" />
            <SkeletonBlock className="mt-3 h-4 w-3/4 bg-white/10" />
            <SkeletonBlock className="mt-6 h-40 w-full bg-white/10" />
          </div>
        ) : sourceManifest && visiblePlatformCards ? (
          <UploadStepper
            sourceManifest={sourceManifest}
            visiblePlatformCards={visiblePlatformCards}
            workspaceReportState={workspaceReportState}
            refreshWorkspaceDataSources={refreshWorkspaceDataSources}
            clearCurrentReport={clearCurrentReport}
            onReportCreated={onReportCreated}
            preferredPlatform={preferredPlatform}
            preferredPlatformNonce={preferredPlatformNonce}
          />
        ) : (
          <ManifestUnavailableCard />
        )}
      </div>
    </section>
  );
}

function PrivacyTrustCard() {
  return (
    <article className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm font-semibold text-white">Privacy</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">Your files stay private and are used only to generate reports and operate the service.</p>
      <TrustMicrocopy
        body={UPLOAD_TRUST_MICROCOPY_BODY}
        className="mt-4 border-white/10 bg-white/[0.02] px-4 py-3"
        testId="workspace-help-trust"
        variant="marketing"
      />
    </article>
  );
}

function HelpSection({ sourceManifestError }: { sourceManifestError: string | null }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-white">Help</h2>
        <p className="mt-1 text-sm text-slate-400">
          {sourceManifestError
            ? `${sourceManifestError} You can still use the guide and troubleshooting steps while the source list recovers.`
            : "Keep the guide and troubleshooting nearby, but out of the main workflow."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm font-semibold text-white">Upload Guide</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">Format rules, supported files, and exact prep steps.</p>
          <Link href="/app/help#upload-guide" className="mt-4 inline-flex text-sm font-medium text-blue-200 underline underline-offset-4 transition hover:text-white">
            Open guide
          </Link>
        </article>

        <article className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm font-semibold text-white">Troubleshooting</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">What to check after a failed or slow upload.</p>
          <Link href="/app/help#after-upload" className="mt-4 inline-flex text-sm font-medium text-blue-200 underline underline-offset-4 transition hover:text-white">
            Open troubleshooting
          </Link>
        </article>

        <PrivacyTrustCard />
      </div>
    </section>
  );
}

function DangerZoneClearData({
  confirming,
  pending,
  error,
  onRequestConfirm,
  onCancel,
  onConfirm,
}: {
  confirming: boolean;
  pending: boolean;
  error: string | null;
  onRequestConfirm: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <section className="rounded-[1.5rem] border border-rose-400/20 bg-rose-400/[0.03] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <h2 className="text-base font-semibold text-white">Clear all data</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Permanently removes all saved workspace sources. Report history is preserved. This cannot be undone.
          </p>
          {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          {!confirming ? (
            <button
              type="button"
              onClick={onRequestConfirm}
              data-testid="clear-data-request"
              className="rounded-xl border border-rose-400/30 px-4 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-400/10 hover:text-rose-200"
            >
              Clear all data
            </button>
          ) : (
            <div className="flex flex-col items-end gap-2">
              <p className="text-xs font-semibold text-rose-300">This will permanently delete all saved sources.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={pending}
                  className="rounded-xl border border-white/10 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/[0.05] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={pending}
                  data-testid="clear-data-confirm"
                  className="rounded-xl bg-rose-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:opacity-50"
                >
                  {pending ? "Clearing..." : "Yes, clear all data"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function buildReadyBannerStatus(
  loading: boolean,
  canRunReport: boolean,
  connectedCount: number,
  reportHasBusinessMetrics: boolean,
): {
  statusLabel: string;
  note: string;
} {
  if (loading) {
    return {
      statusLabel: "Checking",
      note: "Checking your current source status.",
    };
  }

  if (canRunReport) {
    return {
      statusLabel: "Ready",
      note: reportHasBusinessMetrics
        ? "Your current staged sources are ready for a report."
        : "Your sources are ready. Adding revenue + subscriber data will strengthen the report.",
    };
  }

  if (connectedCount > 0) {
    return {
      statusLabel: "Needs attention",
      note: "Add or retry the source you need so the report is ready to run.",
    };
  }

  return {
    statusLabel: "Not added",
    note: "Add your first source to start building a report workspace.",
  };
}

export default function DataUploadPage() {
  const router = useRouter();
  const [sourceManifest, setSourceManifest] = useState<NormalizedSourceManifest | null>(null);
  const [visiblePlatformCards, setVisiblePlatformCards] = useState<UploadPlatformCardMetadata[] | null>(null);
  const [sourceManifestLoading, setSourceManifestLoading] = useState(true);
  const [sourceManifestError, setSourceManifestError] = useState<string | null>(null);
  const [workspaceDataSources, setWorkspaceDataSources] = useState<WorkspaceDataSourcesResponse | null | "loading">("loading");
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [preferredPlatform, setPreferredPlatform] = useState<UploadPlatform | null>(null);
  const [preferredPlatformNonce, setPreferredPlatformNonce] = useState(0);
  const workspaceDataSourcesRef = useRef<WorkspaceDataSourcesResponse | null | "loading">("loading");
  const [runReportPending, setRunReportPending] = useState(false);
  const [runReportError, setRunReportError] = useState<string | null>(null);

  const workspaceReportState = useMemo(
    () =>
      buildWorkspaceReportState(workspaceDataSources === "loading" ? null : workspaceDataSources, {
        isLoading: workspaceDataSources === "loading",
        currentReportId,
      }),
    [currentReportId, workspaceDataSources],
  );

  const refreshWorkspaceDataSources = useCallback(async (options?: { preserveCurrent?: boolean }) => {
    const currentWorkspaceDataSources = workspaceDataSourcesRef.current;
    const preserveCurrent =
      options?.preserveCurrent ??
      (currentWorkspaceDataSources !== "loading" && currentWorkspaceDataSources !== null);

    if (!preserveCurrent) {
      setWorkspaceDataSources("loading");
    }

    try {
      const nextWorkspaceDataSources = await fetchWorkspaceDataSources();
      setWorkspaceDataSources(nextWorkspaceDataSources);
    } catch {
      if (!preserveCurrent) {
        setWorkspaceDataSources(null);
      }
    }
  }, []);

  const clearCurrentReport = useCallback(() => {
    setCurrentReportId(null);
  }, []);

  const handleReportCreated = useCallback((reportId: string) => {
    setCurrentReportId(reportId);
  }, []);

  const handleRunReport = useCallback(async () => {
    if (runReportPending || workspaceReportState.isLoading || !workspaceReportState.canRunReport) {
      return;
    }

    setRunReportPending(true);
    setRunReportError(null);

    try {
      const selectedPlatforms = workspaceReportState.includedSources.map((source) => source.platform);
      const result = await createReportRun({ selectedPlatforms });
      handleReportCreated(result.reportId);
      router.push(`/app/report/${result.reportId}`);
    } catch (error) {
      setRunReportError(getReportErrorMessage(error));
    } finally {
      setRunReportPending(false);
    }
  }, [handleReportCreated, router, runReportPending, workspaceReportState]);

  const handleUploadAction = useCallback((platform: UploadPlatform) => {
    clearCurrentReport();
    setPreferredPlatform(platform);
    setPreferredPlatformNonce((current) => current + 1);

    if (typeof document !== "undefined") {
      requestAnimationFrame(() => {
        document.getElementById("workspace-uploader")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [clearCurrentReport]);

  const [clearDataPending, setClearDataPending] = useState(false);
  const [clearDataConfirming, setClearDataConfirming] = useState(false);
  const [clearDataError, setClearDataError] = useState<string | null>(null);

  const handleClearData = useCallback(async () => {
    setClearDataPending(true);
    setClearDataError(null);
    try {
      await clearWorkspaceData();
      setClearDataConfirming(false);
      await refreshWorkspaceDataSources({ preserveCurrent: false });
    } catch {
      setClearDataError("Failed to clear data. Please try again.");
    } finally {
      setClearDataPending(false);
    }
  }, [refreshWorkspaceDataSources]);

  useEffect(() => {
    workspaceDataSourcesRef.current = workspaceDataSources;
  }, [workspaceDataSources]);

  useEffect(() => {
    let active = true;

    const syncManifest = async () => {
      if (active) {
        setSourceManifestLoading(true);
        setSourceManifestError(null);
      }

      try {
        const manifest = await getSourceManifest();
        const normalized = normalizeSourceManifestResponse(manifest);
        if (!normalized) {
          throw new Error("invalid_source_manifest");
        }

        if (active) {
          setSourceManifest(normalized);
          setVisiblePlatformCards(buildUploadPlatformCardsFromManifest(normalized));
          setSourceManifestError(null);
        }
      } catch {
        if (active) {
          setSourceManifest(null);
          setVisiblePlatformCards(null);
          setSourceManifestError("Supported sources are temporarily unavailable.");
        }
      } finally {
        if (active) {
          setSourceManifestLoading(false);
        }
      }
    };

    void syncManifest();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void refreshWorkspaceDataSources({ preserveCurrent: false });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [refreshWorkspaceDataSources]);

  const sourceListItems = useMemo(
    () =>
      visiblePlatformCards
        ? buildSourceListItems(visiblePlatformCards, workspaceDataSources === "loading" ? null : workspaceDataSources?.sources ?? null)
        : [],
    [visiblePlatformCards, workspaceDataSources],
  );

  const connectedCount = useMemo(
    () => sourceListItems.filter((item) => item.status !== "not_added").length,
    [sourceListItems],
  );

  const readyBanner = useMemo(
    () =>
      buildReadyBannerStatus(
        workspaceReportState.isLoading,
        workspaceReportState.canRunReport,
        connectedCount,
        workspaceReportState.reportHasBusinessMetrics,
      ),
    [connectedCount, workspaceReportState.canRunReport, workspaceReportState.isLoading, workspaceReportState.reportHasBusinessMetrics],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <DataPageHeader />

      <ReadyToRunBanner
        loading={workspaceReportState.isLoading}
        ready={workspaceReportState.canRunReport}
        statusLabel={readyBanner.statusLabel}
        connectedCount={connectedCount}
        note={readyBanner.note}
        runDisabled={runReportPending || workspaceReportState.isLoading || !workspaceReportState.canRunReport}
        onRunReport={handleRunReport}
        onViewReports={() => router.push("/app/report")}
      />

      {runReportError ? (
        <p className="text-sm text-rose-300" data-testid="staged-run-report-error">
          {runReportError}
        </p>
      ) : null}

      <SourceListSection
        items={sourceListItems}
        loading={workspaceDataSources === "loading" || sourceManifestLoading}
        sourceManifest={sourceManifest}
        sourceManifestLoading={sourceManifestLoading}
        visiblePlatformCards={visiblePlatformCards}
        workspaceReportState={workspaceReportState}
        refreshWorkspaceDataSources={() => refreshWorkspaceDataSources({ preserveCurrent: true })}
        clearCurrentReport={clearCurrentReport}
        onReportCreated={handleReportCreated}
        onUploadAction={handleUploadAction}
        preferredPlatform={preferredPlatform}
        preferredPlatformNonce={preferredPlatformNonce}
      />

      <HelpSection sourceManifestError={sourceManifestError} />

      <DangerZoneClearData
        confirming={clearDataConfirming}
        pending={clearDataPending}
        error={clearDataError}
        onRequestConfirm={() => setClearDataConfirming(true)}
        onCancel={() => {
          setClearDataConfirming(false);
          setClearDataError(null);
        }}
        onConfirm={() => void handleClearData()}
      />
    </div>
  );
}
