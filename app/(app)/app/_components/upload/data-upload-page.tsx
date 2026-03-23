"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import UploadCard from "./UploadCard";
import UploadStepper from "./upload-stepper";
import { buttonClassName } from "@/src/components/ui/button";
import { createReportRun, getReportErrorMessage } from "@/src/lib/api/reports";
import { fetchWorkspaceDataSources, type WorkspaceDataSourcesResponse } from "@/src/lib/api/workspace";
import { getUploadSupportMatrix } from "@/src/lib/api/upload";
import { buildReportDetailPathOrIndex } from "@/src/lib/report/path";
import { buildWorkspaceReportState, type WorkspaceReportState } from "@/src/lib/workspace/report-run-state";
import {
  buildVisibleUploadPlatformCardsFromSupportMatrix,
  getFallbackVisibleUploadPlatformCards,
} from "@/src/lib/upload/support-surface";

const FALLBACK_VISIBLE_UPLOAD_PLATFORM_CARDS = getFallbackVisibleUploadPlatformCards();

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
        <h3 className="text-base font-semibold text-slate-900">Staged sources</h3>
        <p className="mt-2 text-sm text-slate-500">Checking workspace...</p>
      </UploadCard>
    );
  }

  if (!workspaceReportState.hasStagedSources || !mostRecentSource) {
    return (
      <UploadCard>
        <h3 className="text-base font-semibold text-slate-900">Staged sources</h3>
        <p className="mt-2 text-sm text-slate-600">No sources staged yet.</p>
        <p className="mt-1 text-xs text-slate-500">
          Upload a supported file to stage your first source. Your report will combine all staged sources.
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

  const showRunReportAction = workspaceReportState.canRunReport && !showViewReportAction;
  const showNeedsReportDrivingSource =
    workspaceReportState.stagedSourcesReadyCount > 0 &&
    !workspaceReportState.canRunReport &&
    workspaceReportState.reportDrivingSourcesReadyCount === 0 &&
    !showViewReportAction;
  const updatedAt = mostRecentSource.lastUploadAt ?? mostRecentSource.lastReadyAt;

  const handleRunReport = async () => {
    if (runReportPending) {
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
    <UploadCard>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Staged sources</h3>
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${statusColor}`}>
          {statusLabel}
        </span>
      </div>
      <p className="mt-0.5 text-[10px] text-slate-400">Showing your most recent source</p>
      <p className="mt-2 text-xs text-slate-500">
        {mostRecentSource.statusMessage ??
          (mostRecentSource.state === "ready"
            ? "This source is staged and ready for your next report."
            : mostRecentSource.state === "processing"
              ? "Upload validation and ingestion are in progress."
              : "This source needs attention. Try uploading again.")}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {showViewReportAction && workspaceReportState.currentReportId ? (
          <Link
            href={buildReportDetailPathOrIndex(workspaceReportState.currentReportId)}
            className="inline-flex rounded-lg border border-brand-blue/30 bg-brand-blue/5 px-3 py-1.5 text-xs font-medium text-brand-blue hover:bg-brand-blue/10"
          >
            View Report
          </Link>
        ) : null}
        {showRunReportAction ? (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              data-testid="staged-run-report"
              onClick={() => void handleRunReport()}
              disabled={runReportPending}
              className="inline-flex rounded-lg border border-brand-blue/30 bg-brand-blue/5 px-3 py-1.5 text-xs font-medium text-brand-blue hover:bg-brand-blue/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runReportPending ? "Running..." : "Run Report"}
            </button>
            <p className="text-[10px] text-slate-400">Combine your staged sources into one report.</p>
          </div>
        ) : null}
        <Link
          href="/app/report"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
        >
          All reports
        </Link>
      </div>
      {runReportError ? (
        <p className="mt-3 text-xs text-rose-600" data-testid="staged-run-report-error">
          {runReportError}
        </p>
      ) : null}
      {showNeedsReportDrivingSource ? (
        <p className="mt-3 text-xs text-slate-500" data-testid="staged-next-best-action">
          Add a report-driving source before running a combined report.
        </p>
      ) : null}
      {updatedAt ? (
        <p className="mt-2 text-[10px] text-slate-400">Updated {new Date(updatedAt).toLocaleString()}</p>
      ) : null}
    </UploadCard>
  );
}

export default function DataUploadPage() {
  const [visiblePlatformCards, setVisiblePlatformCards] = useState(FALLBACK_VISIBLE_UPLOAD_PLATFORM_CARDS);
  const [workspaceDataSources, setWorkspaceDataSources] = useState<WorkspaceDataSourcesResponse | null | "loading">("loading");
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const workspaceDataSourcesRef = useRef<WorkspaceDataSourcesResponse | null | "loading">("loading");

  const supportedRevenueUploads = useMemo(
    () => visiblePlatformCards.map((c) => c.label).join(", "),
    [visiblePlatformCards],
  );
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
    if (process.env.NODE_ENV === "production") {
      return;
    }

    console.info("[upload.workspaceReportState]", {
      workspaceReportState,
      canRunReport: workspaceReportState.canRunReport,
      hasExistingReport: workspaceReportState.hasExistingReport,
    });
  }, [workspaceReportState]);

  useEffect(() => {
    workspaceDataSourcesRef.current = workspaceDataSources;
  }, [workspaceDataSources]);

  useEffect(() => {
    let active = true;

    const syncSupportSurface = async () => {
      try {
        const supportMatrix = await getUploadSupportMatrix();
        const nextVisiblePlatformCards = buildVisibleUploadPlatformCardsFromSupportMatrix(supportMatrix);
        if (active && nextVisiblePlatformCards) {
          setVisiblePlatformCards(nextVisiblePlatformCards);
        }
      } catch {
        // Keep the current safe fallback support surface.
      }
    };

    void syncSupportSurface();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    void refreshWorkspaceDataSources({ preserveCurrent: false });
  }, [refreshWorkspaceDataSources]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-900">Your Report Workspace</h1>
        <p className="text-slate-600">
          Add your data sources to build a complete cross-platform report.
        </p>
        <p className="text-sm text-slate-500">You can add multiple sources before running your report.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.55fr),minmax(20rem,0.95fr)]">
        <div>
          <UploadStepper
            visiblePlatformCards={visiblePlatformCards}
            supportedRevenueUploads={supportedRevenueUploads}
            workspaceReportState={workspaceReportState}
            refreshWorkspaceDataSources={refreshWorkspaceDataSources}
            clearCurrentReport={clearCurrentReport}
            onReportCreated={handleReportCreated}
          />
        </div>

        <div className="space-y-4">
          <UploadCard>
            <div id="upload-guide" data-testid="data-upload-guide">
              <h3 className="text-base font-semibold text-slate-900">What to upload</h3>
              <div className="mt-3 space-y-3 text-sm text-slate-700">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-emerald-700" data-testid="label-report-driving">Report-driving</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    <li>Patreon - native Members CSV export</li>
                    <li>Substack - native subscriber CSV export</li>
                    <li>YouTube - analytics CSV or Takeout ZIP</li>
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-sky-700" data-testid="label-performance-only">Performance-only</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    <li>Instagram - allowlisted ZIP export only</li>
                    <li>TikTok - allowlisted ZIP export only</li>
                  </ul>
                </div>
              </div>
            </div>
          </UploadCard>

          <StagedSourcesPanel
            workspaceDataSources={workspaceDataSources}
            workspaceReportState={workspaceReportState}
            onReportCreated={handleReportCreated}
          />

          <UploadCard>
            <h3 className="text-base font-semibold text-slate-900">Need help?</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Step-by-step file prep, supported format guidance, and troubleshooting in the upload guide.
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
