import { isApiError } from "../api/client";
import type { ReportDetail, ReportListItem, ReportListResult } from "../api/reports";
import { normalizeReportId } from "../report/id";
import { hasUsableReportArtifact } from "../report/artifact-availability";

type CompletedReportCandidate = Pick<ReportListItem, "reportId" | "status" | "createdAt" | "artifactUrl">;

export function findFirstCompletedReport(items: ReportListResult["items"]): CompletedReportCandidate | null {
  for (const item of items) {
    if (
      hasUsableReportArtifact({
        reportId: item.reportId,
        status: item.status,
        artifactUrl: item.artifactUrl,
      })
    ) {
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
  let reports: ReportListResult | null = null;
  try {
    reports = await input.fetchReportsList();
  } catch {
    reports = null;
  }

  const firstCompletedReport = reports ? findFirstCompletedReport(reports.items) : null;
  const latestCompletedFromReports = await fetchReportDetailOrNull(firstCompletedReport?.reportId ?? null, input.fetchReportDetail);
  if (latestCompletedFromReports) {
    return latestCompletedFromReports;
  }

  const canonicalUploadReportId = normalizeReportId(input.latestUploadReportId);
  const latestFromUpload = await fetchReportDetailOrNull(canonicalUploadReportId, input.fetchReportDetail);
  if (latestFromUpload) {
    return latestFromUpload;
  }

  const firstReport = reports ? findFirstReportWithId(reports.items) : null;
  const latestFromReports = await fetchReportDetailOrNull(firstReport?.reportId ?? null, input.fetchReportDetail);
  if (latestFromReports) {
    return latestFromReports;
  }

  return null;
}
