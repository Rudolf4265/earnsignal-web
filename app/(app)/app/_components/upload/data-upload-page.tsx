"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import UploadCard from "./UploadCard";
import UploadStepper from "./upload-stepper";
import { buttonClassName } from "@/src/components/ui/button";
import { createReportRun, getReportErrorMessage } from "@/src/lib/api/reports";
import { fetchWorkspaceDataSources, type WorkspaceDataSourcesResponse } from "@/src/lib/api/workspace";
import { getSourceManifest } from "@/src/lib/api/upload";
import { buildReportDetailPathOrIndex } from "@/src/lib/report/path";
import { buildWorkspaceReportState, type WorkspaceReportState } from "@/src/lib/workspace/report-run-state";
import {
  getFallbackSourceManifest,
  normalizeSourceManifestResponse,
  type NormalizedSourceManifest,
  type UploadPlatformCardMetadata,
  buildUploadPlatformCardsFromManifest,
} from "@/src/lib/upload/platform-metadata";

const FALLBACK_SOURCE_MANIFEST = getFallbackSourceManifest();
const FALLBACK_VISIBLE_UPLOAD_PLATFORM_CARDS = buildUploadPlatformCardsFromManifest(FALLBACK_SOURCE_MANIFEST);

function IncludedSourcesSummary({ workspaceReportState }: { workspaceReportState: WorkspaceReportState }) {
  if (workspaceReportState.includedSources.length === 0) {
    return (
      <p className="text-xs text-slate-500" data-testid="workspace-included-sources-empty">
        No sources are staged for the next report yet.
      </p>
    );
  }

  return (
    <div className="space-y-2" data-testid="workspace-included-sources-summary">
      {workspaceReportState.includedSources.map((source) => (
        <div
          key={source.platform}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">{source.label}</p>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                source.reportRole === "report_driving"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-sky-50 text-sky-700"
              }`}
            >
              {source.reportRole === "report_driving" ? "Primary" : "Supporting"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600">{source.roleSummary}</p>
        </div>
      ))}
    </div>
  );
}

function StagedSourcesPanel({
  workspaceDataSources,
  workspaceReportState,
  onReportCreated,
}: {
  workspaceDataSources: WorkspaceDataSourcesResponse | null | "loading";
  workspaceReportState: WorkspaceReportState;
  onReportCreated: (reportId: string) => void;
}) {
  const router = useRouter();
  const [runReportPending, setRunReportPending] = useState(false);
  const [runReportError, setRunReportError] = useState<string | null>(null);
  const mostRecentSource = workspaceReportState.mostRecentSource;
  const showViewReportAction = workspaceReportState.hasExistingReport && Boolean(workspaceReportState.currentReportId);

  if (workspaceDataSources === "loading" || workspaceReportState.isLoading) {
    return (
      <UploadCard>
        <h3 className="text-base font-semibold text-slate-900">Report readiness</h3>
        <p className="mt-2 text-sm text-slate-500">Checking workspace...</p>
      </UploadCard>
    );
  }

  if (!workspaceReportState.hasStagedSources || !mostRecentSource) {
    return (
      <UploadCard>
        <h3 className="text-base font-semibold text-slate-900">Report readiness</h3>
        <p className="mt-2 text-sm text-slate-600">No sources staged yet.</p>
        <p className="mt-1 text-xs text-slate-500">
          Upload one or more supported data sources, then run a combined report from the staged workspace.
        </p>
      </UploadCard>
    );
  }

  const statusLabel =
    mostRecentSource.state === "ready"
      ? "Ready for report"
      : mostRecentSource.state === "processing"
        ? "Processing"
        : "Needs attention";

  const statusColor =
    mostRecentSource.state === "ready"
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : mostRecentSource.state === "processing"
        ? "text-sky-700 bg-sky-50 border-sky-200"
        : "text-amber-700 bg-amber-50 border-amber-200";

  const updatedAt = mostRecentSource.lastUploadAt ?? mostRecentSource.lastReadyAt;

  const handleRunReport = async () => {
    if (runReportPending || !workspaceReportState.canRunReport) {
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

  const readinessCopy =
    workspaceReportState.reportReadinessNote ??
    (workspaceReportState.canRunReport
      ? "Ready to run a combined report from your staged sources."
      : workspaceReportState.blockingReason ?? "Add at least one report-driving source to run a combined report.");

  return (
    <UploadCard>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Report readiness</h3>
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${statusColor}`}>
          {statusLabel}
        </span>
      </div>
      <p className="mt-0.5 text-[10px] text-slate-400">Most recent source: {mostRecentSource.label}</p>
      <p className="mt-2 text-xs text-slate-600">{readinessCopy}</p>
      {!workspaceReportState.reportHasBusinessMetrics && workspaceReportState.canRunReport ? (
        <p className="mt-2 text-xs text-amber-700" data-testid="staged-business-metrics-note">
          This workspace can run now, but direct revenue and subscriber coverage is limited.
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-500">
            What this report is based on
          </p>
          <div className="mt-2">
            <IncludedSourcesSummary workspaceReportState={workspaceReportState} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {showViewReportAction && workspaceReportState.currentReportId ? (
            <Link
              href={buildReportDetailPathOrIndex(workspaceReportState.currentReportId)}
              className="inline-flex rounded-lg border border-brand-blue/30 bg-brand-blue/5 px-3 py-1.5 text-xs font-medium text-brand-blue hover:bg-brand-blue/10"
            >
              View Report
            </Link>
          ) : null}
          {!showViewReportAction ? (
            <div className="flex flex-col gap-1">
              <button
                type="button"
                data-testid="staged-run-report"
                onClick={() => void handleRunReport()}
                disabled={runReportPending || !workspaceReportState.canRunReport}
                className="inline-flex rounded-lg border border-brand-blue/30 bg-brand-blue/5 px-3 py-1.5 text-xs font-medium text-brand-blue hover:bg-brand-blue/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {runReportPending ? "Running..." : "Run Report"}
              </button>
              <p className="text-[10px] text-slate-400">
                {workspaceReportState.canRunReport
                  ? "Generate one combined report from the staged workspace."
                  : workspaceReportState.blockingReason ?? "Add at least one report-driving source first."}
              </p>
            </div>
          ) : null}
          <Link
            href="/app/report"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
          >
            All reports
          </Link>
        </div>
      </div>
      {runReportError ? (
        <p className="mt-3 text-xs text-rose-600" data-testid="staged-run-report-error">
          {runReportError}
        </p>
      ) : null}
      {updatedAt ? (
        <p className="mt-2 text-[10px] text-slate-400">Updated {new Date(updatedAt).toLocaleString()}</p>
      ) : null}
    </UploadCard>
  );
}

function UploadGuide({ platformCards }: { platformCards: UploadPlatformCardMetadata[] }) {
  return (
    <UploadCard>
      <div id="upload-guide" data-testid="data-upload-guide">
        <h3 className="text-base font-semibold text-slate-900">Supported sources</h3>
        <div className="mt-3 space-y-3">
          {platformCards.map((card) => (
            <div key={card.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{card.label}</p>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                    card.platformRole === "report-driving"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-sky-50 text-sky-700"
                  }`}
                >
                  {card.platformRole === "report-driving" ? "Primary" : "Supporting"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600">{card.guidance}</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Accepted format: {card.fileTypeLabel}
              </p>
            </div>
          ))}
        </div>
      </div>
    </UploadCard>
  );
}

export default function DataUploadPage() {
  const [sourceManifest, setSourceManifest] = useState<NormalizedSourceManifest>(FALLBACK_SOURCE_MANIFEST);
  const [visiblePlatformCards, setVisiblePlatformCards] = useState(FALLBACK_VISIBLE_UPLOAD_PLATFORM_CARDS);
  const [workspaceDataSources, setWorkspaceDataSources] = useState<WorkspaceDataSourcesResponse | null | "loading">("loading");
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
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
      try {
        const manifest = await getSourceManifest();
        const normalized = normalizeSourceManifestResponse(manifest);
        if (active && normalized) {
          setSourceManifest(normalized);
          setVisiblePlatformCards(buildUploadPlatformCardsFromManifest(normalized));
        }
      } catch {
        // Keep the temporary compatibility snapshot.
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
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-900">Your Report Workspace</h1>
        <p className="text-slate-600">
          Stage real creator data sources, then generate one combined decision-ready report.
        </p>
        <p className="text-sm text-slate-500">
          EarnSigma validates and stages each source first. Reports are generated from the workspace snapshot you choose to run.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.55fr),minmax(20rem,0.95fr)]">
        <div>
          <UploadStepper
            sourceManifest={sourceManifest}
            visiblePlatformCards={visiblePlatformCards}
            workspaceReportState={workspaceReportState}
            refreshWorkspaceDataSources={refreshWorkspaceDataSources}
            clearCurrentReport={clearCurrentReport}
            onReportCreated={handleReportCreated}
          />
        </div>

        <div className="space-y-4">
          <UploadGuide platformCards={visiblePlatformCards} />

          <StagedSourcesPanel
            workspaceDataSources={workspaceDataSources}
            workspaceReportState={workspaceReportState}
            onReportCreated={handleReportCreated}
          />

          <UploadCard>
            <h3 className="text-base font-semibold text-slate-900">Need help?</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Step-by-step prep, current support notes, and troubleshooting in the upload guide.
            </p>
            <Link href="/app/help#upload-guide" className={buttonClassName({ variant: "secondary", size: "sm", className: "mt-4" })}>
              Open upload guide
            </Link>
          </UploadCard>
        </div>
      </div>
    </div>
  );
}
