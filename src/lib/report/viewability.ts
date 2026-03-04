import { normalizeReportId, type ReportListItem } from "../api/reports";

function normalizeArtifactUrl(report: ReportListItem): string | null {
  const artifactUrl = typeof report.artifact_url === "string" ? report.artifact_url.trim() : "";
  return artifactUrl.length > 0 ? artifactUrl : null;
}

export function getReportHref(report: ReportListItem): string | null {
  const artifactUrl = normalizeArtifactUrl(report);
  if (artifactUrl) {
    return artifactUrl;
  }

  const reportId = normalizeReportId(report);
  if (reportId) {
    return `/app/report/${encodeURIComponent(reportId)}`;
  }

  return null;
}

export function isReportViewable(report: ReportListItem): boolean {
  if (report.status !== "ready") {
    return false;
  }

  return getReportHref(report) !== null;
}

