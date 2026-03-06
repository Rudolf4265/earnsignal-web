import { ApiError, apiFetchBlobWithMeta, apiFetchJson, getApiBaseOrigin, getApiBaseUrl } from "./client";
import { normalizeReportDetail, type ReportDetail } from "../report/normalize-report-detail";
import { normalizeReportsListResponse, type ReportListItem, type ReportListResult } from "../report/list-model";
import { normalizeReportId } from "../report/id";
import type { ReportDetailResponseSchema } from "./generated";

export type { ReportDetail, ReportListItem, ReportListResult };

function requireReportId(reportId: unknown, context: string): string {
  const normalized = normalizeReportId(reportId);
  if (!normalized) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[report.api] blocked request without a valid report_id.", {
        context,
        reportId: reportId ?? null,
      });
    }

    throw new Error(`Report ID is unavailable for ${context}.`);
  }

  return normalized;
}

export async function fetchReportDetail(reportId: string): Promise<ReportDetail> {
  const canonicalReportId = requireReportId(reportId, "report.fetch");
  const data = await apiFetchJson<ReportDetailResponseSchema>("report.fetch", `/v1/reports/${encodeURIComponent(canonicalReportId)}`, {
    method: "GET",
  });

  return normalizeReportDetail(canonicalReportId, data as Record<string, unknown>);
}

export async function fetchReportArtifactJson(artifactJsonUrl: string): Promise<unknown> {
  return apiFetchJson<unknown>("report.artifact_json", artifactJsonUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });
}

export async function fetchReportsList(offset?: number | null): Promise<ReportListResult> {
  const normalizedOffset = typeof offset === "number" && Number.isFinite(offset) ? Math.max(0, Math.trunc(offset)) : null;
  const path = normalizedOffset === null ? "/v1/reports" : `/v1/reports?offset=${encodeURIComponent(String(normalizedOffset))}`;
  const data = await apiFetchJson<Record<string, unknown>>("reports.list", path, {
    method: "GET",
  });

  return normalizeReportsListResponse(data);
}

function isAbsoluteHttpUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

function isDirectBrowserUrl(value: string): boolean {
  return value.startsWith("blob:") || value.startsWith("data:");
}

type ReportArtifactTarget = {
  reportId: string;
  artifactUrl?: string | null;
};

function extractReportIdFromReportsPath(pathOrUrl: string): { matched: boolean; reportId: string | null } {
  let pathname = pathOrUrl;
  try {
    pathname = new URL(pathOrUrl, "https://report-id-check.local").pathname;
  } catch {
    return { matched: false, reportId: null };
  }

  const match = pathname.match(/^\/v1\/reports\/([^/?#]+)(?:\/artifact(?:\.json)?)?\/?$/i);
  if (!match) {
    return { matched: false, reportId: null };
  }

  let candidate = match[1];
  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    // Ignore decode errors and use raw path token.
  }

  return {
    matched: true,
    reportId: normalizeReportId(candidate),
  };
}

function isReportPdfArtifactPath(pathOrUrl: string): boolean {
  let pathname = pathOrUrl;
  try {
    pathname = new URL(pathOrUrl, "https://report-id-check.local").pathname;
  } catch {
    return false;
  }

  return /^\/v1\/reports\/[^/?#]+\/artifact\/?$/i.test(pathname);
}

function resolveReportArtifactPath({ reportId, artifactUrl }: ReportArtifactTarget): string {
  const canonicalReportId = requireReportId(reportId, "report.artifact");
  const trimmed = artifactUrl?.trim();
  if (trimmed) {
    const embedded = extractReportIdFromReportsPath(trimmed);
    const isPdfArtifactPath = isReportPdfArtifactPath(trimmed);
    if (embedded.matched && embedded.reportId === canonicalReportId && isPdfArtifactPath) {
      return trimmed;
    }

    if (process.env.NODE_ENV !== "production") {
      console.warn("[report.api] ignoring artifact_url for PDF fetch because it is not a canonical report artifact path.", {
        artifactUrl: trimmed,
        expectedReportId: canonicalReportId,
        embeddedReportId: embedded.reportId,
        isPdfArtifactPath,
      });
    }
  }

  return `/v1/reports/${encodeURIComponent(canonicalReportId)}/artifact`;
}

function toAbsoluteApiUrl(pathOrUrl: string): string {
  if (isAbsoluteHttpUrl(pathOrUrl) || isDirectBrowserUrl(pathOrUrl)) {
    return pathOrUrl;
  }

  const base = getApiBaseUrl();
  return `${base}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export function buildReportArtifactPdfUrl(target: ReportArtifactTarget): string {
  return toAbsoluteApiUrl(resolveReportArtifactPath(target));
}

function normalizeFilenameSegment(value: string): string {
  return value
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function formatPdfContentTypeError(status: number, contentType: string | null): string {
  const normalizedContentType = contentType && contentType.trim() ? contentType : "unknown";
  return `PDF endpoint returned non-PDF content (HTTP ${status}, content-type: ${normalizedContentType}).`;
}

function hasPdfFilenameInContentDisposition(contentDisposition: string | null): boolean {
  if (!contentDisposition) {
    return false;
  }

  return /\.pdf(?:["';\s]|$)/i.test(contentDisposition);
}

function validatePdfResponse(status: number, contentType: string | null, contentDisposition: string | null): void {
  const normalized = contentType?.toLowerCase().trim() ?? "";
  const isPdfContentType = normalized.startsWith("application/pdf");
  const isPdfOctetStream = normalized.startsWith("application/octet-stream") && hasPdfFilenameInContentDisposition(contentDisposition);
  if (!isPdfContentType && !isPdfOctetStream) {
    throw new Error(formatPdfContentTypeError(status, contentType));
  }
}

async function fetchPdfBlobFromAbsoluteUrl(
  operation: string,
  url: string,
): Promise<{ blob: Blob; status: number; contentType: string | null; contentDisposition: string | null }> {
  const apiOrigin = getApiBaseOrigin();
  const urlOrigin = new URL(url).origin;
  if (urlOrigin === apiOrigin) {
    return apiFetchBlobWithMeta(operation, url, { method: "GET", headers: { Accept: "application/pdf" } });
  }

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/pdf" },
  });

  if (!response.ok) {
    throw new Error(`PDF request failed with status ${response.status}.`);
  }

  return {
    blob: await response.blob(),
    status: response.status,
    contentType: response.headers.get("content-type"),
    contentDisposition: response.headers.get("content-disposition"),
  };
}

function validatePdfBlob(blob: Blob): void {
  if (blob.size === 0) {
    throw new Error("Report PDF download returned an empty file.");
  }
}

export async function fetchReportPdfBlobUrl(report: ReportDetail): Promise<string> {
  const absoluteUrl = buildReportArtifactPdfUrl({ reportId: report.id, artifactUrl: report.artifactUrl });
  if (isDirectBrowserUrl(absoluteUrl)) {
    return absoluteUrl;
  }

  const result = await fetchPdfBlobFromAbsoluteUrl("report.pdf", absoluteUrl);
  validatePdfResponse(result.status, result.contentType, result.contentDisposition);
  validatePdfBlob(result.blob);
  return URL.createObjectURL(result.blob);
}

export async function downloadReportArtifactPdf(report: Pick<ReportListItem, "reportId" | "title"> & { artifactUrl?: string | null }): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Report downloads are only available in the browser.");
  }
  const canonicalReportId = requireReportId(report.reportId, "report.artifact_download");

  const absoluteUrl = buildReportArtifactPdfUrl({ reportId: canonicalReportId, artifactUrl: report.artifactUrl });
  const result = await fetchPdfBlobFromAbsoluteUrl("report.artifact", absoluteUrl);
  validatePdfResponse(result.status, result.contentType, result.contentDisposition);
  validatePdfBlob(result.blob);
  const objectUrl = URL.createObjectURL(result.blob);
  try {
    const link = document.createElement("a");
    const baseName = normalizeFilenameSegment(report.title ?? "");
    const fallbackName = normalizeFilenameSegment(`report-${canonicalReportId}`);
    link.href = objectUrl;
    link.download = `${baseName || fallbackName || "report"}.pdf`;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function getReportErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load report file.";
}
