import { normalizeReportId } from "./id";

export const REPORTS_INDEX_PATH = "/app/report";

export function buildReportDetailPath(reportId: unknown): string | null {
  const canonicalReportId = normalizeReportId(reportId);
  if (!canonicalReportId) {
    return null;
  }

  return `/app/report/${encodeURIComponent(canonicalReportId)}`;
}

export function buildReportDetailPathOrIndex(reportId: unknown): string {
  return buildReportDetailPath(reportId) ?? REPORTS_INDEX_PATH;
}
