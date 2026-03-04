import { normalizeReportId, type ReportListItem } from "../api/reports";

export function getReportHref(report: ReportListItem): string | null {
  const reportId = normalizeReportId(report);
  if (!reportId) {
    return null;
  }

  return `/app/report/${encodeURIComponent(reportId)}`;
}

export function isReportViewable(report: ReportListItem): boolean {
  if (report.status !== "ready") {
    return false;
  }

  return normalizeReportId(report) !== null;
}
