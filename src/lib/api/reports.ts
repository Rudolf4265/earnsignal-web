import { ApiError, apiFetchJson } from "./client";
import { normalizeReportDetail, type ReportDetail } from "../report/normalize-report-detail";

export type { ReportDetail };

export type ReportListStatus = "queued" | "running" | "ready" | "failed";

export type ReportListItem = {
  report_id: string | null;
  created_at: string;
  status: ReportListStatus;
  artifact_url: string | null;
  artifact_kind: string | null;
  upload_id: string | null;
  job_id: string | null;
  title: string | null;
  platforms: string[] | null;
  coverage_start: string | null;
  coverage_end: string | null;
};

export type ReportListResponse = {
  items: ReportListItem[];
  next_offset: number;
  has_more: boolean;
};

const DEBUG_REPORTS = process.env.NEXT_PUBLIC_DEBUG_REPORTS === "1";

function debugReports(message: string, details?: Record<string, unknown>) {
  if (!DEBUG_REPORTS) {
    return;
  }

  if (details) {
    console.debug(`[reports] ${message}`, details);
    return;
  }

  console.debug(`[reports] ${message}`);
}

function readString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") {
      return value;
    }
  }
  return null;
}

function readDate(record: Record<string, unknown>, keys: string[]): string | null {
  const value = readString(record, keys);
  return value && value.trim() ? value : null;
}

function readPlatforms(record: Record<string, unknown>): string[] | null {
  const value = record.platforms;
  if (!Array.isArray(value)) {
    return null;
  }

  const platforms = value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  return platforms.length > 0 ? platforms : null;
}

export function normalizeReportId(item: unknown): string | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const record = item as Record<string, unknown>;
  const candidate = record.report_id ?? record.reportId ?? record.id ?? null;
  if (typeof candidate !== "string") {
    return null;
  }

  const trimmed = candidate.trim();
  return trimmed ? trimmed : null;
}

function normalizeStatus(input: string | null): ReportListStatus {
  const normalized = input?.trim().toLowerCase();

  if (!normalized) {
    return "queued";
  }

  if (["queued", "pending", "created", "waiting"].includes(normalized)) {
    return "queued";
  }

  if (["running", "processing", "in_progress", "started"].includes(normalized)) {
    return "running";
  }

  if (["ready", "completed", "complete", "done", "success"].includes(normalized)) {
    return "ready";
  }

  if (["failed", "error", "cancelled", "canceled"].includes(normalized)) {
    return "failed";
  }

  return "queued";
}

function normalizeItem(payload: unknown): ReportListItem | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const createdAt = readDate(record, ["created_at", "createdAt"]);

  if (!createdAt) {
    return null;
  }

  return {
    report_id: normalizeReportId(record),
    created_at: createdAt,
    status: normalizeStatus(readString(record, ["status"])),
    artifact_url: readString(record, ["artifact_url", "artifactUrl"]),
    artifact_kind: readString(record, ["artifact_kind", "artifactKind"]),
    upload_id: readString(record, ["upload_id", "uploadId"]),
    job_id: readString(record, ["job_id", "jobId"]),
    title: readString(record, ["title"]),
    platforms: readPlatforms(record),
    coverage_start: readDate(record, ["coverage_start", "coverageStart"]),
    coverage_end: readDate(record, ["coverage_end", "coverageEnd"]),
  };
}

function readNumber(record: Record<string, unknown>, keys: string[], fallback: number): number {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return fallback;
}

function readBoolean(record: Record<string, unknown>, keys: string[], fallback: boolean): boolean {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") {
      return value;
    }
  }

  return fallback;
}

function normalizeListResponse(payload: unknown): ReportListResponse {
  if (!payload || typeof payload !== "object") {
    return { items: [], next_offset: 0, has_more: false };
  }

  const record = payload as Record<string, unknown>;
  const rawItems = Array.isArray(record.items) ? record.items : [];
  const items = rawItems.map(normalizeItem).filter((entry): entry is ReportListItem => entry !== null);

  return {
    items,
    next_offset: readNumber(record, ["next_offset", "nextOffset"], items.length),
    has_more: readBoolean(record, ["has_more", "hasMore"], false),
  };
}

function toReportApiError(path: string, method: string, error: unknown): never {
  if (error instanceof ApiError) {
    throw error;
  }

  throw new ApiError({
    status: 0,
    code: "NETWORK_ERROR",
    message: error instanceof Error ? error.message : "Network request failed.",
    operation: "reports.client",
    path,
    method,
    details: error,
  });
}

export async function listReports(params: { limit?: number; offset?: number } = {}): Promise<ReportListResponse> {
  const limit = Math.min(Math.max(params.limit ?? 25, 1), 100);
  const offset = Math.max(params.offset ?? 0, 0);
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  const path = `/v1/reports?${query.toString()}`;
  debugReports("request", { path, tokenAttached: true });
  try {
    const data = await apiFetchJson<Record<string, unknown>>("reports.list", path, { method: "GET" });
    debugReports("response", { path, status: 200, tokenAttached: true });
    return normalizeListResponse(data);
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? (error as { status?: unknown }).status : undefined;
    debugReports("response", { path, status: typeof status === "number" ? status : "network", tokenAttached: true });
    toReportApiError(path, "GET", error);
  }
}

export async function getReport(reportId: string): Promise<ReportDetail> {
  const normalizedId = typeof reportId === "string" ? reportId.trim() : "";
  if (!normalizedId || normalizedId.toLowerCase() === "undefined" || normalizedId.toLowerCase() === "null") {
    throw new ApiError({
      status: 400,
      code: "invalid_report_id",
      message: "Invalid report ID.",
      operation: "report.fetch",
      path: "/v1/reports/:reportId",
      method: "GET",
      details: { reportId },
    });
  }

  const encodedId = encodeURIComponent(normalizedId);
  const path = `/v1/reports/${encodedId}`;
  debugReports("request", { path, tokenAttached: true });
  try {
    const data = await apiFetchJson<Record<string, unknown>>("report.fetch", path, { method: "GET" });
    debugReports("response", { path, status: 200, tokenAttached: true });
    return normalizeReportDetail(normalizedId, data);
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? (error as { status?: unknown }).status : undefined;
    debugReports("response", { path, status: typeof status === "number" ? status : "network", tokenAttached: true });
    toReportApiError(path, "GET", error);
  }
}

export const fetchReportDetail = getReport;
