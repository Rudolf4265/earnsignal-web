import { isApiError } from "../api/client";
import type { ReportDetail, ReportListItem, ReportListResult } from "../api/reports";
import { normalizeReportId } from "../report/id";

const COMPLETED_REPORT_STATUSES = new Set(["ready", "completed", "complete", "success", "succeeded"]);

type CompletedReportCandidate = Pick<ReportListItem, "reportId" | "status" | "createdAt">;

function isCompletedReportStatus(status: string): boolean {
  return COMPLETED_REPORT_STATUSES.has(status.trim().toLowerCase());
}

export function findFirstCompletedReport(items: ReportListResult["items"]): CompletedReportCandidate | null {
  for (const item of items) {
    if (item.reportId && isCompletedReportStatus(item.status)) {
      return item;
    }
  }

  return null;
}

function findFirstReportWithId(items: ReportListResult["items"]): Pick<ReportListItem, "reportId"> | null {
  for (const item of items) {
    if (item.reportId) {
      return item;
    }
  }

  return null;
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
  latestUploadReportId: string | null | undefined;
  fetchReportDetail: (reportId: string) => Promise<ReportDetail>;
  fetchReportsList: () => Promise<ReportListResult>;
};

export async function loadLatestDashboardReport(input: LoadLatestDashboardReportInput): Promise<ReportDetail | null> {
  let reports: ReportListResult;
  try {
    reports = await input.fetchReportsList();
  } catch {
    reports = {
      items: [],
      nextOffset: null,
      hasMore: false,
    };
  }

  const firstReport = findFirstReportWithId(reports.items);
  const latestFromReports = await fetchReportDetailOrNull(firstReport?.reportId ?? null, input.fetchReportDetail);
  if (latestFromReports) {
    return latestFromReports;
  }

  const canonicalUploadReportId = normalizeReportId(input.latestUploadReportId);
  return fetchReportDetailOrNull(canonicalUploadReportId, input.fetchReportDetail);
}
