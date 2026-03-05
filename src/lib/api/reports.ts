import { ApiError, apiFetchBlob, apiFetchJson, getApiBaseOrigin } from "./client";
import { normalizeReportDetail, type ReportDetail } from "../report/normalize-report-detail";
import type { ReportDetailResponseSchema } from "./generated";

export type { ReportDetail };

export async function fetchReportDetail(reportId: string): Promise<ReportDetail> {
  const data = await apiFetchJson<ReportDetailResponseSchema>("report.fetch", `/v1/reports/${encodeURIComponent(reportId)}`, {
    method: "GET",
  });

  return normalizeReportDetail(reportId, data as Record<string, unknown>);
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

export function getReportErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load report file.";
}
