"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import UploadStepper from "./upload-stepper";
import { buttonClassName } from "@/src/components/ui/button";
import { TrustMicrocopy, UPLOAD_TRUST_MICROCOPY_BODY } from "@/src/components/ui/trust-microcopy";
import { createReportRun, getReportErrorMessage } from "@/src/lib/api/reports";
import { fetchWorkspaceDataSources, type WorkspaceDataSource, type WorkspaceDataSourcesResponse } from "@/src/lib/api/workspace";
import { getSourceManifest } from "@/src/lib/api/upload";
import { buildReportDetailPathOrIndex } from "@/src/lib/report/path";
import { buildWorkspaceReportState, type WorkspaceReportState } from "@/src/lib/workspace/report-run-state";
import {
  normalizeSourceManifestResponse,
  type NormalizedSourceManifest,
  type UploadPlatformCardMetadata,
  buildUploadPlatformCardsFromManifest,
} from "@/src/lib/upload/platform-metadata";

type ChecklistStatus = "complete" | "current" | "optional";

type ChecklistItem = {
  id: string;
  label: string;
  helper: string;
  status: ChecklistStatus;
};

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

function formatConnectedSourcesSummary(primaryCount: number, supportingCount: number): string {
  const primarySummary = `${primaryCount} report-driving ${pluralize(primaryCount, "source")} connected`;
  if (supportingCount === 0) {
    return primarySummary;
  }

  return `${primarySummary} and ${supportingCount} optional ${pluralize(supportingCount, "source")} connected`;
}

function formatWorkspaceUpdatedAt(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return new Date(parsed).toLocaleString();
}

function buildChecklistItems(workspaceReportState: WorkspaceReportState): ChecklistItem[] {
  const supportingCount = workspaceReportState.includedSources.filter((source) => source.reportRole === "supporting").length;
  const totalIncludedCount = workspaceReportState.includedSourceCount;
  const reportDrivingCount = workspaceReportState.reportDrivingIncludedSourceCount;

  return [
    {
      id: "report-driving-source",
      label: "Add a report-driving source",
      helper: reportDrivingCount > 0 ? `${reportDrivingCount} connected` : "Patreon, Substack, or YouTube",
      status: reportDrivingCount > 0 ? "complete" : "current",
    },
    {
      id: "another-source",
      label: "Add another source",
      helper: totalIncludedCount > 1 ? `${totalIncludedCount} sources staged` : "Improves report coverage",
      status: totalIncludedCount > 1 ? "complete" : totalIncludedCount > 0 ? "current" : "optional",
    },
    {
      id: "audience-context",
      label: "Add audience context",
      helper: supportingCount > 0 ? `${supportingCount} connected` : "Instagram or TikTok",
      status: supportingCount > 0 ? "complete" : reportDrivingCount > 0 ? "current" : "optional",
    },
  ];
}

function getSourceStatusPresentation(source: WorkspaceDataSource | null | undefined): {
  label: string;
  className: string;
  summary: string;
  actionLabel: string;
} {
  if (!source || source.state === "missing") {
    return {
      label: "Not added",
      className: "border-white/10 bg-white/[0.05] text-slate-300",
      summary: "Not staged in the workspace yet.",
      actionLabel: "Add source",
    };
  }

  if (source.state === "processing") {
    return {
      label: "Processing",
      className: "border-sky-400/20 bg-sky-400/10 text-sky-200",
      summary: source.statusMessage ?? "This source is still being validated.",
      actionLabel: source.actionLabel === "View status" ? "View status" : "Upload again",
    };
  }

  if (source.state === "failed") {
    return {
      label: "Needs attention",
      className: "border-amber-400/20 bg-amber-400/10 text-amber-200",
      summary: source.statusMessage ?? "This source needs another upload before it can be included.",
      actionLabel: source.actionLabel === "Retry" ? "Retry source" : "Replace source",
    };
  }

  return {
    label: source.includedInNextReport ? "Connected" : "Ready",
    className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    summary:
      source.statusMessage ??
      (source.includedInNextReport ? "Included in the next report snapshot." : "Staged and ready in the workspace."),
    actionLabel: source.actionLabel === "Replace" ? "Replace source" : "Refresh source",
  };
}

function WorkspaceHeader() {
  return (
    <section className="space-y-2">
      <h1 className="text-3xl font-semibold text-white">Your Report Workspace</h1>
      <p className="max-w-3xl text-sm leading-6 text-slate-300">
        Stage creator data, then run one combined decision-ready report from the current workspace snapshot.
      </p>
    </section>
  );
}

function WorkspaceActionHero({
  workspaceReportState,
  onReportCreated,
}: {
  workspaceReportState: WorkspaceReportState;
  onReportCreated: (reportId: string) => void;
}) {
  const router = useRouter();
  const [runReportPending, setRunReportPending] = useState(false);
  const [runReportError, setRunReportError] = useState<string | null>(null);

  const primaryCount = workspaceReportState.reportDrivingIncludedSourceCount;
  const supportingCount = workspaceReportState.includedSources.filter((source) => source.reportRole === "supporting").length;
  const mostRecentSource = workspaceReportState.mostRecentSource;
  const updatedAt = formatWorkspaceUpdatedAt(mostRecentSource?.lastUploadAt ?? mostRecentSource?.lastReadyAt);

  const readinessLabel = workspaceReportState.isLoading
    ? "Checking workspace"
    : workspaceReportState.canRunReport
      ? "Ready to run"
      : "Add a source to continue";

  const headline = workspaceReportState.isLoading
    ? "Checking your workspace"
    : workspaceReportState.canRunReport
      ? "Your workspace is ready"
      : "Start building your report";

  const summary = workspaceReportState.isLoading
    ? "We're syncing your latest staged sources and report eligibility."
    : workspaceReportState.includedSourceCount > 0
      ? formatConnectedSourcesSummary(primaryCount, supportingCount)
      : workspaceReportState.hasStagedSources
        ? workspaceReportState.blockingReason ?? "Your sources are still staging. Add one report-driving source to unlock Run Report."
        : "No sources are staged yet. Add at least one report-driving source like Patreon, Substack, or YouTube.";

  const handleRunReport = async () => {
    if (runReportPending || workspaceReportState.isLoading || !workspaceReportState.canRunReport) {
      return;
    }

    setRunReportPending(true);
    setRunReportError(null);

    try {
      const result = await createReportRun();
      onReportCreated(result.reportId);
      router.push(buildReportDetailPathOrIndex(result.reportId));
    } catch (error) {
      setRunReportError(getReportErrorMessage(error));
    } finally {
      setRunReportPending(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(145deg,rgba(11,24,50,0.96),rgba(14,32,69,0.96),rgba(9,20,43,0.98))] p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.95)] sm:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-200">
            {readinessLabel}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-white sm:text-[2rem]">{headline}</h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-300">{summary}</p>
            {mostRecentSource ? (
              <p className="text-xs text-slate-400">
                Latest source: {mostRecentSource.label}
                {updatedAt ? ` | Updated ${updatedAt}` : ""}
              </p>
            ) : null}
          </div>

          <p className="max-w-2xl text-sm leading-6 text-slate-200">
            Your report will include revenue, subscriber, and growth insights when supported by your staged data.
          </p>

          {workspaceReportState.reportReadinessNote ? (
            <p className="text-xs text-slate-400">{workspaceReportState.reportReadinessNote}</p>
          ) : null}

          {!workspaceReportState.reportHasBusinessMetrics && workspaceReportState.canRunReport ? (
            <p className="text-xs text-amber-200/90" data-testid="staged-business-metrics-note">
              This workspace can run now, but direct revenue and subscriber coverage is limited.
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-3 lg:items-end">
          <button
            type="button"
            data-testid="staged-run-report"
            onClick={() => void handleRunReport()}
            disabled={runReportPending || workspaceReportState.isLoading || !workspaceReportState.canRunReport}
            className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-slate-400"
          >
            {runReportPending ? "Running..." : "Run Report"}
          </button>
          <Link
            href="/app/report"
            className="text-sm font-medium text-slate-300 underline underline-offset-4 transition hover:text-white"
          >
            View all reports
          </Link>
          {!workspaceReportState.canRunReport && !workspaceReportState.isLoading ? (
            <p className="max-w-xs text-right text-xs leading-5 text-slate-400">
              {workspaceReportState.blockingReason ?? "Add at least one report-driving source to run a combined report."}
            </p>
          ) : null}
        </div>
      </div>

      {runReportError ? (
        <p className="mt-4 text-sm text-rose-300" data-testid="staged-run-report-error">
          {runReportError}
        </p>
      ) : null}
    </section>
  );
}

function WorkspaceChecklist({ workspaceReportState }: { workspaceReportState: WorkspaceReportState }) {
  const items = buildChecklistItems(workspaceReportState);

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Build your report</h3>
        <p className="mt-1 text-sm text-slate-400">A quick view of what&apos;s done and what&apos;s optional.</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {items.map((item) => (
          <ChecklistRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  const tone =
    item.status === "complete"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
      : item.status === "current"
        ? "border-blue-400/20 bg-blue-400/10 text-blue-200"
        : "border-white/10 bg-white/[0.03] text-slate-300";
  const icon = item.status === "complete" ? "OK" : item.status === "current" ? ">" : "+";

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f1d38]/85 p-4">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-7 min-w-7 items-center justify-center rounded-full border px-1 text-[10px] font-semibold ${tone}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{item.label}</p>
          <p className="mt-1 text-xs text-slate-400">{item.helper}</p>
        </div>
      </div>
    </div>
  );
}

function SourceCard({
  card,
  source,
}: {
  card: UploadPlatformCardMetadata;
  source: WorkspaceDataSource | null | undefined;
}) {
  const status = getSourceStatusPresentation(source);

  return (
    <article className="rounded-2xl border border-white/10 bg-[#0f1d38]/90 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-white">{card.label}</h4>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                card.platformRole === "report-driving"
                  ? "bg-emerald-400/10 text-emerald-200"
                  : "bg-sky-400/10 text-sky-200"
              }`}
            >
              {card.platformRole === "report-driving" ? "Report-driving" : "Optional context"}
            </span>
          </div>
          <p className="text-xs text-slate-400">{card.subtitle}</p>
        </div>
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        <p className="text-sm leading-6 text-slate-300">{status.summary}</p>
        <p className="text-xs leading-5 text-slate-400">{card.roleSummary}</p>
        <p className="text-xs leading-5 text-slate-400">Accepted format: {card.fileTypeLabel}</p>
        <p className="text-xs leading-5 text-slate-400">{card.guidance}</p>
        {card.knownLimitations.length > 0 ? (
          <ul className="space-y-1 text-xs leading-5 text-slate-500">
            {card.knownLimitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {(source?.state === "missing" || source?.state === "failed" || source?.state === "processing" || !source) ? (
        <a
          href="#workspace-uploader"
          className="mt-4 inline-flex text-sm font-medium text-blue-200 underline underline-offset-4 transition hover:text-white"
        >
          {status.actionLabel}
        </a>
      ) : null}
    </article>
  );
}

function WorkspaceSourceDrawer({
  isOpen,
  onToggle,
  sourceManifest,
  sourceManifestLoading,
  visiblePlatformCards,
  workspaceDataSources,
  workspaceReportState,
  refreshWorkspaceDataSources,
  clearCurrentReport,
  onReportCreated,
}: {
  isOpen: boolean;
  onToggle: () => void;
  sourceManifest: NormalizedSourceManifest | null;
  sourceManifestLoading: boolean;
  visiblePlatformCards: UploadPlatformCardMetadata[] | null;
  workspaceDataSources: WorkspaceDataSourcesResponse | null | "loading";
  workspaceReportState: WorkspaceReportState;
  refreshWorkspaceDataSources: (options?: { preserveCurrent?: boolean }) => Promise<void>;
  clearCurrentReport: () => void;
  onReportCreated: (reportId: string) => void;
}) {
  const sourceLookup = useMemo(() => {
    if (workspaceDataSources === "loading" || !workspaceDataSources) {
      return new Map<string, WorkspaceDataSource>();
    }

    return new Map(workspaceDataSources.sources.map((source) => [source.platform, source]));
  }, [workspaceDataSources]);

  const supportingCount = workspaceReportState.includedSources.filter((source) => source.reportRole === "supporting").length;
  const connectedSummary = workspaceReportState.isLoading
    ? "Syncing staged sources"
    : `${workspaceReportState.reportDrivingIncludedSourceCount} report-driving / ${supportingCount} optional connected`;

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] backdrop-blur-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-col gap-3 px-5 py-4 text-left sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h3 className="text-sm font-semibold text-white">Your data sources</h3>
          <p className="mt-1 text-sm text-slate-400">
            View connected sources, support details, and add more data when you need it.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{connectedSummary}</p>
          <span className="text-sm font-medium text-slate-300">{isOpen ? "Hide details" : "View details"}</span>
        </div>
      </button>

      {isOpen ? (
        <div className="border-t border-white/10 px-5 py-5">
          {sourceManifestLoading ? (
            <div className="rounded-2xl border border-white/10 bg-[#0f1d38]/90 p-4">
              <h4 className="text-sm font-semibold text-white">Loading supported sources</h4>
              <p className="mt-2 text-sm text-slate-400">Checking the canonical source manifest...</p>
            </div>
          ) : sourceManifest && visiblePlatformCards ? (
            <div className="space-y-6">
              <div id="upload-guide" data-testid="data-upload-guide" className="rounded-2xl border border-white/10 bg-[#0f1d38]/90 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-accent-teal">Source support</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{sourceManifest.eligibilityRule}</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">{sourceManifest.businessMetricsRule}</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {visiblePlatformCards.map((card) => (
                  <SourceCard key={card.id} card={card} source={sourceLookup.get(card.id)} />
                ))}
              </div>

              <div className="border-t border-white/10 pt-6">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-white">Add or refresh a source</h4>
                    <p className="mt-1 text-sm text-slate-400">
                      Upload validation and staging still follow the same backend truth and report-eligibility rules.
                    </p>
                  </div>
                  <Link
                    href="/app/help#upload-guide"
                    className="text-sm font-medium text-blue-200 underline underline-offset-4 transition hover:text-white"
                  >
                    Open upload guide
                  </Link>
                </div>

                <div id="workspace-uploader">
                  <UploadStepper
                    sourceManifest={sourceManifest}
                    visiblePlatformCards={visiblePlatformCards}
                    workspaceReportState={workspaceReportState}
                    refreshWorkspaceDataSources={refreshWorkspaceDataSources}
                    clearCurrentReport={clearCurrentReport}
                    onReportCreated={onReportCreated}
                  />
                </div>
              </div>
            </div>
          ) : (
            <ManifestUnavailableCard />
          )}
        </div>
      ) : null}
    </section>
  );
}

function WorkspaceHelpFooter({ sourceManifestError }: { sourceManifestError: string | null }) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h3 className="text-sm font-semibold text-white">Need help?</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {sourceManifestError
              ? `${sourceManifestError} Use the upload guide for current prep steps and troubleshooting while the canonical manifest path recovers.`
              : "Prep steps, supported formats, and troubleshooting are available in the upload guide. Privacy and trust details stay visible here without crowding the workspace."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/app/help#upload-guide"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/[0.05] hover:text-white"
          >
            Open upload guide
          </Link>
          <Link
            href="/app/help#after-upload"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/[0.05] hover:text-white"
          >
            Troubleshooting
          </Link>
        </div>
      </div>

      <TrustMicrocopy
        body={UPLOAD_TRUST_MICROCOPY_BODY}
        className="mt-5 border-white/10 bg-white/[0.03]"
        testId="workspace-help-trust"
        variant="marketing"
      />
    </section>
  );
}

function ManifestUnavailableCard() {
  return (
    <section className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-5">
      <div data-testid="source-manifest-unavailable" className="space-y-3">
        <h3 className="text-base font-semibold text-white">Supported sources unavailable</h3>
        <p className="text-sm leading-relaxed text-slate-300">
          The canonical source manifest could not be loaded, so the upload flow is paused instead of falling back to stale local support data.
        </p>
        <p className="text-xs text-slate-400">
          Reload the page and try again. If the problem persists, review the help guide while the backend manifest is restored.
        </p>
        <Link href="/app/help#upload-guide" className={buttonClassName({ variant: "secondary", size: "sm" })}>
          Open upload guide
        </Link>
      </div>
    </section>
  );
}

export default function DataUploadPage() {
  const [sourceManifest, setSourceManifest] = useState<NormalizedSourceManifest | null>(null);
  const [visiblePlatformCards, setVisiblePlatformCards] = useState<UploadPlatformCardMetadata[] | null>(null);
  const [sourceManifestLoading, setSourceManifestLoading] = useState(true);
  const [sourceManifestError, setSourceManifestError] = useState<string | null>(null);
  const [workspaceDataSources, setWorkspaceDataSources] = useState<WorkspaceDataSourcesResponse | null | "loading">("loading");
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const workspaceDataSourcesRef = useRef<WorkspaceDataSourcesResponse | null | "loading">("loading");

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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <WorkspaceHeader />
      <WorkspaceActionHero workspaceReportState={workspaceReportState} onReportCreated={handleReportCreated} />
      <WorkspaceChecklist workspaceReportState={workspaceReportState} />
      <WorkspaceSourceDrawer
        isOpen={sourcesExpanded}
        onToggle={() => setSourcesExpanded((current) => !current)}
        sourceManifest={sourceManifest}
        sourceManifestLoading={sourceManifestLoading}
        visiblePlatformCards={visiblePlatformCards}
        workspaceDataSources={workspaceDataSources}
        workspaceReportState={workspaceReportState}
        refreshWorkspaceDataSources={refreshWorkspaceDataSources}
        clearCurrentReport={clearCurrentReport}
        onReportCreated={handleReportCreated}
      />
      <WorkspaceHelpFooter sourceManifestError={sourceManifestError} />
    </div>
  );
}
