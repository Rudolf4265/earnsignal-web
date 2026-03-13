import { normalizeReportId } from "./id.ts";

const COMPLETED_REPORT_STATUSES = new Set(["ready", "completed", "complete", "success", "succeeded"]);

function extractReportIdFromArtifactPath(pathOrUrl: string): string | null {
  let pathname = pathOrUrl;
  try {
    pathname = new URL(pathOrUrl, "https://report-artifact-check.local").pathname;
  } catch {
    return null;
  }

  const match = pathname.match(/^\/v1\/reports\/([^/?#]+)\/artifact\/?$/i);
  if (!match) {
    return null;
  }

  try {
    return normalizeReportId(decodeURIComponent(match[1]));
  } catch {
    return normalizeReportId(match[1]);
  }
}

export function isCompletedReportStatus(status: string): boolean {
  return COMPLETED_REPORT_STATUSES.has(status.trim().toLowerCase());
}

type ReportArtifactAvailabilityInput = {
  reportId: string | null | undefined;
  status: string;
  artifactUrl: string | null | undefined;
};

export function hasUsableReportArtifact(input: ReportArtifactAvailabilityInput): boolean {
  if (!isCompletedReportStatus(input.status)) {
    return false;
  }

  const canonicalReportId = normalizeReportId(input.reportId);
  if (!canonicalReportId) {
    return false;
  }

  const artifactUrl = typeof input.artifactUrl === "string" ? input.artifactUrl.trim() : "";
  if (!artifactUrl) {
    return false;
  }

  return extractReportIdFromArtifactPath(artifactUrl) === canonicalReportId;
}
