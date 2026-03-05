import { ApiError, apiFetchBlob, apiFetchJson, getApiBaseOrigin } from "./client";
import { normalizeReportDetail, type ReportDetail } from "../report/normalize-report-detail";
import { normalizeReportsListResponse, type ReportListItem, type ReportListResult } from "../report/list-model";
import type { ReportDetailResponseSchema } from "./generated";

export type { ReportDetail, ReportListItem, ReportListResult };

export async function fetchReportDetail(reportId: string): Promise<ReportDetail> {
  const data = await apiFetchJson<ReportDetailResponseSchema>("report.fetch", `/v1/reports/${encodeURIComponent(reportId)}`, {
    method: "GET",
  });

  return normalizeReportDetail(reportId, data as Record<string, unknown>);
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

function resolveReportPdfPath(report: ReportDetail): string {
  if (report.pdfUrl && report.pdfUrl.trim()) {
    return report.pdfUrl.trim();
  }

  return `/v1/reports/${encodeURIComponent(report.id)}/pdf`;
}

function normalizeFilenameSegment(value: string): string {
  return value
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function fetchPdfBlobFromAbsoluteUrl(url: string): Promise<Blob> {
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/pdf" },
  });

  if (!response.ok) {
    throw new Error(`PDF request failed with status ${response.status}.`);
  }

  return response.blob();
}

function validatePdfBlob(blob: Blob): void {
  const contentType = blob.type.toLowerCase();
  if (blob.size === 0) {
    throw new Error("Report PDF download returned an empty file.");
  }

  if (contentType && !contentType.includes("pdf")) {
    throw new Error(`Expected PDF content but received "${blob.type}".`);
  }
}

export async function fetchReportPdfBlobUrl(report: ReportDetail): Promise<string> {
  const path = resolveReportPdfPath(report);
  if (path.startsWith("blob:") || path.startsWith("data:")) {
    return path;
  }

  let blob: Blob;
  if (isAbsoluteHttpUrl(path)) {
    const apiOrigin = getApiBaseOrigin();
    const pathOrigin = new URL(path).origin;
    if (pathOrigin === apiOrigin) {
      blob = await apiFetchBlob("report.pdf", path, { method: "GET", headers: { Accept: "application/pdf" } });
    } else {
      blob = await fetchPdfBlobFromAbsoluteUrl(path);
    }
  } else {
    blob = await apiFetchBlob("report.pdf", path, { method: "GET", headers: { Accept: "application/pdf" } });
  }

  validatePdfBlob(blob);
  return URL.createObjectURL(blob);
}

export async function downloadReportArtifactPdf(report: Pick<ReportListItem, "reportId" | "title" | "artifactUrl">): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Report downloads are only available in the browser.");
  }

  const path = report.artifactUrl?.trim();
  if (!path) {
    throw new Error("Report artifact is unavailable.");
  }

  let blob: Blob;
  if (isAbsoluteHttpUrl(path)) {
    const apiOrigin = getApiBaseOrigin();
    const pathOrigin = new URL(path).origin;
    if (pathOrigin === apiOrigin) {
      blob = await apiFetchBlob("report.artifact", path, { method: "GET", headers: { Accept: "application/pdf" } });
    } else {
      blob = await fetchPdfBlobFromAbsoluteUrl(path);
    }
  } else {
    blob = await apiFetchBlob("report.artifact", path, { method: "GET", headers: { Accept: "application/pdf" } });
  }

  validatePdfBlob(blob);
  const objectUrl = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    const baseName = normalizeFilenameSegment(report.title ?? "");
    const fallbackName = normalizeFilenameSegment(`report-${report.reportId}`);
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
