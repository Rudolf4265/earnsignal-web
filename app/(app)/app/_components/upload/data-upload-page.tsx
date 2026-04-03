"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import UploadStepper from "./upload-stepper";
import ReportWindowChooserDialog from "./report-window-chooser-dialog";
import { SkeletonBlock } from "../../../_components/ui/skeleton";
import { buttonClassName } from "@/src/components/ui/button";
import { StatusPill } from "@/src/components/ui/status-pill";
import { createReportRun, getReportErrorMessage, type CreateReportRunAnalysisWindow } from "@/src/lib/api/reports";
import { clearWorkspaceData, fetchWorkspaceDataSources, type WorkspaceDataSourcesResponse } from "@/src/lib/api/workspace";
import { getSourceManifest, type UploadPlatform } from "@/src/lib/api/upload";
import { buildWorkspaceReportState } from "@/src/lib/workspace/report-run-state";
import { resolveWorkspaceReportWindowPolicy } from "@/src/lib/workspace/report-window-policy";
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
import { useEntitlementState } from "../../../_components/use-entitlement-state";

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
  runLabel?: string;
  runDisabled?: boolean;
  onRunReport: () => void;
  onViewReports: () => void;
};

type SourceRowProps = {
  item: SourceListItem;
  onUploadAction: (platform: UploadPlatform) => void;
};

type SourceListSectionProps = {
  items: SourceListItem[];
  loading: boolean;
  hasManifest: boolean;
  onAddSource: () => void;
  onUploadAction: (platform: UploadPlatform) => void;
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
  runLabel = "Run Report",
  runDisabled = false,
  onRunReport,
  onViewReports,
}: ReadyToRunBannerProps) {
  const countLabel = `${connectedCount} ${connectedCount === 1 ? "source" : "sources"} ready for this report`;

  return (
    <section
      className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(145deg,rgba(11,24,50,0.96),rgba(14,32,69,0.96),rgba(9,20,43,0.98))] p-5 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.95)] sm:p-6"
      data-testid="workspace-run-report-section"
    >
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
            {note ? <p className="text-xs leading-5 text-slate-400">{note}</p> : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              data-testid="staged-run-report"
              onClick={() => void onRunReport()}
              disabled={runDisabled}
              className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-white px-7 py-3 text-base font-semibold text-slate-950 shadow-[0_18px_40px_-24px_rgba(255,255,255,0.85)] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-slate-400 sm:min-w-52"
            >
              {runLabel}
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

function renderAction(action: SourceListAction | undefined, onUploadAction: (platform: UploadPlatform) => void, variant: "primary" | "secondary") {
  if (!action) {
    return null;
  }

  if (action.kind === "link") {
    return (
      <Link
        href={action.href}
        className={
          variant === "secondary"
            ? "text-sm font-medium text-slate-400 underline underline-offset-4 transition hover:text-white"
            : buttonClassName({
                variant: "secondary",
                size: "sm",
                className: "h-9 rounded-xl border-white/10 bg-white/[0.04] px-3 text-slate-200 hover:bg-white/[0.08] hover:text-white",
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
        variant === "secondary"
          ? "text-sm font-medium text-slate-400 underline underline-offset-4 transition hover:text-white"
          : buttonClassName({
              variant: "secondary",
              size: "sm",
              className: "h-9 rounded-xl border-white/10 bg-white/[0.04] px-3 text-slate-200 hover:bg-white/[0.08] hover:text-white",
            })
      }
    >
      {action.label}
    </button>
  );
}

function SourceRow({ item, onUploadAction }: SourceRowProps) {
  const metaLabel =
    item.status === "fix_needed"
      ? item.issueLabel || "Needs review"
      : item.lastUpdatedLabel
        ? `Last updated ${item.lastUpdatedLabel}`
        : "No upload yet";

  return (
    <div
      className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-white/[0.02] md:flex-row md:items-center md:justify-between md:gap-4"
      data-testid={`workspace-source-row-${item.id}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.03] ring-1 ring-inset ring-white/8">
          <Image src={item.icon} alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
        </div>
        <div className="min-w-0 space-y-1">
          <h3 className="truncate text-sm font-semibold text-white">{item.name}</h3>
          <p className="text-xs leading-5 text-slate-400">{metaLabel}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 md:justify-end">
        <StatusPill variant={getPrimarySourceStatusVariant(item.status)} className="text-[11px] tracking-wide">
          {getPrimarySourceStatusLabel(item.status)}
        </StatusPill>
        {renderAction(item.primaryAction, onUploadAction, "primary")}
        {renderAction(item.secondaryAction, onUploadAction, "secondary")}
      </div>
    </div>
  );
}

function SourceRowsSkeleton() {
  return (
    <div className="divide-y divide-white/8">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={`workspace-source-skeleton-${index + 1}`} className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="flex items-start gap-3">
            <SkeletonBlock className="h-9 w-9 rounded-xl bg-white/10" />
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-24 bg-white/10" />
              <SkeletonBlock className="h-3 w-32 bg-white/10" />
            </div>
          </div>
          <div className="flex items-center gap-3 md:justify-end">
            <SkeletonBlock className="h-6 w-24 rounded-full bg-white/10" />
            <SkeletonBlock className="h-9 w-24 rounded-xl bg-white/10" />
            <SkeletonBlock className="h-4 w-14 bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptySourceListState({ onAddSource, hasManifest }: { onAddSource: () => void; hasManifest: boolean }) {
  return (
    <div className="px-5 py-8 text-center">
      <p className="text-sm font-medium text-white">No sources added yet</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">Added and attempted uploads will appear here after you stage them.</p>
      <button
        type="button"
        onClick={onAddSource}
        disabled={!hasManifest}
        className="mt-5 inline-flex h-10 items-center rounded-xl bg-brand-blue px-4 text-sm font-semibold text-white shadow-[0_0_24px_-10px_rgba(59,130,246,0.8)] transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-slate-500"
      >
        Add your first source
      </button>
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
  hasManifest,
  onAddSource,
  onUploadAction,
}: SourceListSectionProps) {
  return (
    <section className="rounded-[1.75rem] border border-white/8 bg-white/[0.02]" data-testid="workspace-source-list-section">
      <div className="flex flex-col gap-3 border-b border-white/8 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Your data sources</h2>
          <p className="mt-1 text-sm text-slate-400">Review the sources you have already added and keep your next report ready.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/app/settings#data-sources" className="text-sm font-medium text-slate-300 underline underline-offset-4 transition hover:text-white">
            Advanced details
          </Link>
          <button
            type="button"
            onClick={onAddSource}
            disabled={!hasManifest}
            className="inline-flex h-10 items-center rounded-xl bg-brand-blue px-4 text-sm font-semibold text-white shadow-[0_0_24px_-10px_rgba(59,130,246,0.8)] transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-white/[0.08] disabled:text-slate-500"
          >
            Add source
          </button>
        </div>
      </div>

      {loading ? (
        <SourceRowsSkeleton />
      ) : hasManifest ? (
        items.length > 0 ? (
          <div className="divide-y divide-white/8">
            {items.map((item) => (
              <SourceRow key={item.id} item={item} onUploadAction={onUploadAction} />
            ))}
          </div>
        ) : (
          <EmptySourceListState onAddSource={onAddSource} hasManifest={hasManifest} />
        )
      ) : (
        <div className="p-5">
          <ManifestUnavailableCard />
        </div>
      )}
    </section>
  );
}

function UploadFlowSkeleton() {
  return (
    <section className="space-y-6 rounded-[1.75rem] border border-white/8 bg-white/[0.02] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-48 bg-white/10" />
          <SkeletonBlock className="h-4 w-60 bg-white/10" />
        </div>
        <SkeletonBlock className="h-4 w-28 bg-white/10" />
      </div>
      <SkeletonBlock className="h-16 rounded-2xl bg-white/10" />
      <SkeletonBlock className="h-5 w-64 bg-white/10" />
      <SkeletonBlock className="h-64 rounded-[1.5rem] bg-white/10" />
    </section>
  );
}

function HelpSection({ sourceManifestError }: { sourceManifestError: string | null }) {
  return (
    <section className="rounded-[1.5rem] border border-white/8 bg-white/[0.02] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Help</h2>
          <p className="mt-1 text-sm text-slate-400">
            {sourceManifestError
              ? `${sourceManifestError} Use the guide and troubleshooting while the source list recovers.`
              : "Keep the supporting references nearby without interrupting the main workflow."}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Link href="/app/help#upload-guide" className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]">
          <p className="text-sm font-semibold text-white">Upload Guide</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">Format rules, supported files, and exact prep steps.</p>
          <span className="mt-4 inline-flex text-sm font-medium text-slate-300 underline underline-offset-4 transition hover:text-white">
            Open guide
          </span>
        </Link>

        <Link href="/app/help/troubleshooting" className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]">
          <p className="text-sm font-semibold text-white">Troubleshooting</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">What to check after a failed or slow upload.</p>
          <span className="mt-4 inline-flex text-sm font-medium text-slate-300 underline underline-offset-4 transition hover:text-white">
            Open troubleshooting
          </span>
        </Link>

        <Link href="/data-privacy" className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 transition hover:bg-white/[0.04]">
          <p className="text-sm font-semibold text-white">Privacy</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">How uploads stay private and are used to operate the service.</p>
          <span className="mt-4 inline-flex text-sm font-medium text-slate-300 underline underline-offset-4 transition hover:text-white">
            Learn more
          </span>
        </Link>
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
        ? ""
        : "Your sources are ready. Adding revenue + subscriber data will strengthen the report.",
    };
  }

  if (connectedCount > 0) {
    return {
      statusLabel: "Fix needed",
      note: "Connect or retry the source you need so the report is ready to run.",
    };
  }

  return {
    statusLabel: "No sources yet",
    note: "Add your first source to start building a report workspace.",
  };
}

export default function DataUploadPage() {
  const router = useRouter();
  const entitlementState = useEntitlementState();
  const reportAccessBlocked = !entitlementState.loading && !entitlementState.canGenerateReport;
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
  const [analysisWindowDialogOpen, setAnalysisWindowDialogOpen] = useState(false);

  const workspaceReportState = useMemo(
    () =>
      buildWorkspaceReportState(workspaceDataSources === "loading" ? null : workspaceDataSources, {
        isLoading: workspaceDataSources === "loading",
        currentReportId,
      }),
    [currentReportId, workspaceDataSources],
  );

  const reportWindowPolicy = useMemo(
    () =>
      resolveWorkspaceReportWindowPolicy({
        reportModeAllowed: entitlementState.reportModeAllowed,
        maxReportMonths: entitlementState.maxReportMonths,
        canUseFullHistoryWindow: entitlementState.canUseFullHistoryWindow,
        coverageMonths: workspaceReportState.coverageMonths,
        coverageStart: workspaceReportState.coverageStart,
        coverageEnd: workspaceReportState.coverageEnd,
        monthsPresent: workspaceReportState.monthsPresent,
      }),
    [
      entitlementState.canUseFullHistoryWindow,
      entitlementState.maxReportMonths,
      entitlementState.reportModeAllowed,
      workspaceReportState.coverageEnd,
      workspaceReportState.coverageMonths,
      workspaceReportState.coverageStart,
      workspaceReportState.monthsPresent,
    ],
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

  const clearRunReportError = useCallback(() => {
    setRunReportError(null);
  }, []);

  const submitReportRun = useCallback(async (analysisWindow?: CreateReportRunAnalysisWindow | null) => {
    if (runReportPending || workspaceReportState.isLoading || !workspaceReportState.canRunReport || reportAccessBlocked) {
      return;
    }

    setRunReportPending(true);
    setRunReportError(null);

    try {
      const selectedPlatforms = workspaceReportState.includedSources.map((source) => source.platform);
      const result = await createReportRun({ selectedPlatforms, analysisWindow: analysisWindow ?? undefined });
      handleReportCreated(result.reportId);
      setAnalysisWindowDialogOpen(false);
      router.push(`/app/report/${result.reportId}`);
    } catch (error) {
      setRunReportError(getReportErrorMessage(error));
    } finally {
      setRunReportPending(false);
    }
  }, [handleReportCreated, reportAccessBlocked, router, runReportPending, workspaceReportState]);

  const handleRunReport = useCallback(async () => {
    if (runReportPending || workspaceReportState.isLoading || !workspaceReportState.canRunReport || reportAccessBlocked) {
      return;
    }

    if (reportWindowPolicy.requiresWindowChooser) {
      setRunReportError(null);
      setAnalysisWindowDialogOpen(true);
      return;
    }

    if (reportWindowPolicy.directRunMode === "full_history") {
      await submitReportRun({ mode: "full_history", startMonth: null, endMonth: null });
      return;
    }

    await submitReportRun();
  }, [
    reportWindowPolicy.directRunMode,
    reportWindowPolicy.requiresWindowChooser,
    runReportPending,
    submitReportRun,
    reportAccessBlocked,
    workspaceReportState.canRunReport,
    workspaceReportState.isLoading,
  ]);

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

  const handleAddSource = useCallback(() => {
    if (typeof document !== "undefined") {
      requestAnimationFrame(() => {
        document.getElementById("workspace-uploader")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

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
    () => sourceListItems.filter((item) => item.status !== "not_connected").length,
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
    [
      connectedCount,
      workspaceReportState.canRunReport,
      workspaceReportState.isLoading,
      workspaceReportState.reportHasBusinessMetrics,
    ],
  );

  const readyBannerNote = workspaceReportState.canRunReport ? reportWindowPolicy.summaryNote ?? readyBanner.note : readyBanner.note;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <DataPageHeader />

      <div id="workspace-uploader">
        {sourceManifestLoading ? (
          <UploadFlowSkeleton />
        ) : sourceManifest && visiblePlatformCards ? (
          <UploadStepper
            sourceManifest={sourceManifest}
            visiblePlatformCards={visiblePlatformCards}
            workspaceReportState={workspaceReportState}
            refreshWorkspaceDataSources={() => refreshWorkspaceDataSources({ preserveCurrent: true })}
            clearCurrentReport={clearCurrentReport}
            onClearRunReportError={clearRunReportError}
            preferredPlatform={preferredPlatform}
            preferredPlatformNonce={preferredPlatformNonce}
          />
        ) : (
          <ManifestUnavailableCard />
        )}
      </div>

      <ReportWindowChooserDialog
        open={analysisWindowDialogOpen}
        busy={runReportPending}
        error={runReportError}
        latestSnapshotWindow={reportWindowPolicy.latestSnapshotWindow}
        onClose={() => {
          if (!runReportPending) {
            setAnalysisWindowDialogOpen(false);
          }
        }}
        onRunLatestWindow={() =>
          void submitReportRun(
            reportWindowPolicy.latestSnapshotWindow
              ? {
                  mode: "latest_3_months",
                  startMonth: reportWindowPolicy.latestSnapshotWindow.startMonth,
                  endMonth: reportWindowPolicy.latestSnapshotWindow.endMonth,
                }
              : null,
          )
        }
      />

      <SourceListSection
        items={sourceListItems}
        loading={workspaceDataSources === "loading" || sourceManifestLoading}
        hasManifest={Boolean(sourceManifest && visiblePlatformCards)}
        onAddSource={handleAddSource}
        onUploadAction={handleUploadAction}
      />

      {runReportError ? (
        <p className="text-sm text-rose-300" data-testid="staged-run-report-error">
          {runReportError}
        </p>
      ) : null}

      <ReadyToRunBanner
        loading={workspaceReportState.isLoading}
        ready={workspaceReportState.canRunReport}
        statusLabel={readyBanner.statusLabel}
        connectedCount={connectedCount}
        note={readyBannerNote}
        runLabel={reportWindowPolicy.runCtaLabel}
        runDisabled={runReportPending || workspaceReportState.isLoading || !workspaceReportState.canRunReport || reportAccessBlocked}
        onRunReport={handleRunReport}
        onViewReports={() => router.push("/app/report")}
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
