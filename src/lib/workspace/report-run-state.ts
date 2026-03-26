import type { WorkspaceDataSource, WorkspaceDataSourcesResponse } from "../api/workspace";

export type WorkspaceReportState = {
  stagedSourcesReadyCount: number;
  reportDrivingSourcesReadyCount: number;
  includedSourceCount: number;
  reportDrivingIncludedSourceCount: number;
  canRunReport: boolean;
  hasExistingReport: boolean;
  hasStagedSources: boolean;
  isLoading: boolean;
  currentReportId: string | null;
  mostRecentSource: WorkspaceDataSource | null;
  eligibleForReport: boolean;
  blockingReason: string | null;
  reportReadinessNote: string | null;
  reportHasBusinessMetrics: boolean;
  includedSources: WorkspaceDataSource[];
};

function toTimestamp(source: WorkspaceDataSource): number {
  const candidates = [source.lastUploadAt, source.lastReadyAt];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const parsed = Date.parse(candidate);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return Number.NEGATIVE_INFINITY;
}

function findMostRecentSource(sources: WorkspaceDataSource[]): WorkspaceDataSource | null {
  const candidates = sources.filter((source) => source.state !== "missing");
  if (candidates.length === 0) {
    return null;
  }

  const [mostRecent] = [...candidates].sort((left, right) => toTimestamp(right) - toTimestamp(left));
  return mostRecent ?? null;
}

export function buildWorkspaceReportState(
  workspaceDataSources: WorkspaceDataSourcesResponse | null | undefined,
  options?: {
    isLoading?: boolean;
    currentReportId?: string | null;
  },
): WorkspaceReportState {
  const sources = workspaceDataSources?.sources ?? [];
  const includedSources = sources.filter((source) => source.includedInNextReport);
  const reportDrivingSourcesReadyCount =
    workspaceDataSources?.reportDrivingReadySourceCount ??
    sources.filter((source) => source.state === "ready" && source.reportRole === "report_driving").length;
  const reportDrivingIncludedSourceCount =
    workspaceDataSources?.reportDrivingIncludedSourceCount ??
    includedSources.filter((source) => source.reportRole === "report_driving").length;
  // Canonical readiness comes from the backend workspace payload. Keep the
  // legacy field only as a temporary compatibility fallback during rollout.
  const eligibleForReport =
    workspaceDataSources?.eligibleForReport ??
    workspaceDataSources?.runReportEnabled ??
    false;

  return {
    stagedSourcesReadyCount: workspaceDataSources?.readySourceCount ?? 0,
    reportDrivingSourcesReadyCount,
    includedSourceCount: includedSources.length,
    reportDrivingIncludedSourceCount,
    canRunReport: eligibleForReport,
    hasExistingReport: Boolean(options?.currentReportId),
    hasStagedSources: sources.some((source) => source.state !== "missing"),
    isLoading: options?.isLoading === true,
    currentReportId: options?.currentReportId ?? null,
    mostRecentSource: findMostRecentSource(sources),
    eligibleForReport,
    blockingReason: workspaceDataSources?.blockingReason ?? null,
    reportReadinessNote: workspaceDataSources?.reportReadinessNote ?? null,
    reportHasBusinessMetrics: workspaceDataSources?.reportHasBusinessMetrics ?? false,
    includedSources,
  };
}
