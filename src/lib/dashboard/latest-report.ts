import { isApiError } from "../api/client";
import type { ReportDetail, ReportListItem, ReportListResult } from "../api/reports";
import { hasUsableReportArtifact } from "../report/artifact-availability";

type CompletedReportCandidate = Pick<ReportListItem, "reportId" | "status" | "createdAt" | "artifactUrl">;

function toTimestamp(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function compareReportRecency(left: Pick<ReportListItem, "createdAt">, right: Pick<ReportListItem, "createdAt">): number {
  const leftTimestamp = toTimestamp(left.createdAt);
  const rightTimestamp = toTimestamp(right.createdAt);

  if (leftTimestamp !== null && rightTimestamp !== null && leftTimestamp !== rightTimestamp) {
    return rightTimestamp - leftTimestamp;
  }

  if (leftTimestamp === null && rightTimestamp !== null) {
    return 1;
  }

  if (leftTimestamp !== null && rightTimestamp === null) {
    return -1;
  }

  return 0;
}

export function findFirstCompletedReport(items: ReportListResult["items"]): CompletedReportCandidate | null {
  const completed = items.filter((item) =>
    hasUsableReportArtifact({
      reportId: item.reportId,
      status: item.status,
      artifactUrl: item.artifactUrl,
    }),
  );

  if (completed.length === 0) {
    return null;
  }

  const [latest] = [...completed].sort(compareReportRecency);
  return latest ?? null;
}

function findFirstReportWithId(items: ReportListResult["items"]): Pick<ReportListItem, "reportId"> | null {
  const withIds = items.filter((item) => item.reportId);
  if (withIds.length === 0) {
    return null;
  }

  const [latest] = [...withIds].sort(compareReportRecency);
  return latest ?? null;
}

async function fetchReportDetailOrNull(
  reportId: string | null,
  fetchReportDetail: (reportId: string) => Promise<ReportDetail>,
): Promise<ReportDetail | null> {
  if (!reportId) {
    return null;
  }

  try {
    return await fetchReportDetail(reportId);
  } catch (error) {
    if (isApiError(error) && error.status === 404) {
      return null;
    }

    throw error;
  }
}

type LoadLatestDashboardReportInput = {
  fetchReportDetail: (reportId: string) => Promise<ReportDetail>;
  fetchReportsList: () => Promise<ReportListResult>;
  reportsList?: ReportListResult | null;
};

export async function loadLatestDashboardReport(input: LoadLatestDashboardReportInput): Promise<ReportDetail | null> {
  let reports: ReportListResult | null = null;
  const hasProvidedReports = Object.prototype.hasOwnProperty.call(input, "reportsList");

  if (hasProvidedReports) {
    reports = input.reportsList ?? null;
  } else {
    try {
      reports = await input.fetchReportsList();
    } catch {
      reports = null;
    }
  }

  const firstCompletedReport = reports ? findFirstCompletedReport(reports.items) : null;
  const latestCompletedFromReports = await fetchReportDetailOrNull(firstCompletedReport?.reportId ?? null, input.fetchReportDetail);
  if (latestCompletedFromReports) {
    return latestCompletedFromReports;
  }

  const firstReport = reports ? findFirstReportWithId(reports.items) : null;
  const latestFromReports = await fetchReportDetailOrNull(firstReport?.reportId ?? null, input.fetchReportDetail);
  if (latestFromReports) {
    return latestFromReports;
  }

  return null;
}
