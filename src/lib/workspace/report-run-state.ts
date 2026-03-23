import type { WorkspaceDataSource, WorkspaceDataSourcesResponse } from "../api/workspace";
import { UPLOAD_PLATFORM_CARDS } from "../upload/platform-metadata";

const REPORT_DRIVING_PLATFORMS = new Set(
  UPLOAD_PLATFORM_CARDS.filter((card) => card.platformRole === "report-driving").map((card) => card.id),
);

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

function isReportDrivingSource(platform: WorkspaceDataSource["platform"]): boolean {
  return REPORT_DRIVING_PLATFORMS.has(platform);
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
  const includedReadySourceCount = sources.filter((source) => source.state === "ready" && source.includedInNextReport).length;
  const reportDrivingSourcesReadyCount =
    workspaceDataSources?.reportDrivingReadySourceCount ??
    sources.filter((source) => source.state === "ready" && isReportDrivingSource(source.platform)).length;
  const reportDrivingIncludedReadySourceCount =
    workspaceDataSources?.reportDrivingIncludedSourceCount ??
    sources.filter(
      (source) => source.state === "ready" && source.includedInNextReport && isReportDrivingSource(source.platform),
    ).length;

  return {
    stagedSourcesReadyCount: workspaceDataSources?.readySourceCount ?? 0,
    reportDrivingSourcesReadyCount,
    includedSourceCount: includedReadySourceCount,
    reportDrivingIncludedSourceCount: reportDrivingIncludedReadySourceCount,
    canRunReport: reportDrivingIncludedReadySourceCount > 0,
    hasExistingReport: Boolean(options?.currentReportId),
    hasStagedSources: sources.some((source) => source.state !== "missing"),
    isLoading: options?.isLoading === true,
    currentReportId: options?.currentReportId ?? null,
    mostRecentSource: findMostRecentSource(sources),
  };
}
