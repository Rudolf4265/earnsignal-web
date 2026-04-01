import { ApiError, apiFetchBlobWithMeta, apiFetchJson, getApiBaseOrigin, getApiBaseUrl, isEntitlementRequiredError } from "./client";
import { normalizeReportDetail, type ReportDetail } from "../report/normalize-report-detail";
import { normalizeReportsListResponse, type ReportListItem, type ReportListResult } from "../report/list-model";
import { normalizeReportId } from "../report/id";
import type { ReportDetailResponseSchema } from "./generated";

export type { ReportDetail, ReportListItem, ReportListResult };
const REPORT_LIST_TTL_MS = 5_000;
const REPORT_LIST_DEFAULT_OFFSET_KEY = -1;
const reportListCache = new Map<number, { value: ReportListResult; fetchedAt: number }>();
const reportListInFlight = new Map<number, Promise<ReportListResult>>();

export type CreateReportRunResponse = {
  reportId: string;
};

export type CreateReportRunAnalysisWindow =
  | {
      mode: "full_history";
      startMonth?: null;
      endMonth?: null;
    }
  | {
      mode: "latest_3_months";
      startMonth: string;
      endMonth: string;
    };

export type ReportRunStatus = {
  reportId: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  schemaVersion: string | null;
  failureCode: string | null;
  failureReason: string | null;
  stalledReason: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
};

function readNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildFreshReportReadInit(): { cache: RequestCache } {
  return {
    cache: "no-store",
  };
}

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
  const freshReadInit = buildFreshReportReadInit();
  const data = await apiFetchJson<ReportDetailResponseSchema>("report.fetch", `/v1/reports/${encodeURIComponent(canonicalReportId)}`, {
    method: "GET",
    ...freshReadInit,
  });

  return normalizeReportDetail(canonicalReportId, data as Record<string, unknown>);
}

function buildCreateReportRunBody(options?: {
  selectedPlatforms?: string[];
  analysisWindow?: CreateReportRunAnalysisWindow;
}): string | undefined {
  const payload: Record<string, unknown> = {};

  if (options?.selectedPlatforms && options.selectedPlatforms.length > 0) {
    payload.selected_platforms = options.selectedPlatforms;
  }

  if (options?.analysisWindow) {
    payload.analysis_window = {
      mode: options.analysisWindow.mode,
      window_start: options.analysisWindow.startMonth ?? null,
      window_end: options.analysisWindow.endMonth ?? null,
    };
    payload.analysis_window_mode = options.analysisWindow.mode;

    if (options.analysisWindow.startMonth) {
      payload.window_start = options.analysisWindow.startMonth;
    }

    if (options.analysisWindow.endMonth) {
      payload.window_end = options.analysisWindow.endMonth;
    }
  }

  return Object.keys(payload).length > 0 ? JSON.stringify(payload) : undefined;
}

export async function createReportRun(options?: {
  selectedPlatforms?: string[];
  analysisWindow?: CreateReportRunAnalysisWindow;
}): Promise<CreateReportRunResponse> {
  const body = buildCreateReportRunBody(options);

  const data = await apiFetchJson<Record<string, unknown>>("reports.run", "/v1/reports/run", {
    method: "POST",
    ...(body ? { headers: { "Content-Type": "application/json" }, body } : {}),
  });

  const reportId = normalizeReportId(data.report_id ?? data.reportId ?? data.id);
  if (!reportId) {
    throw new Error("Report run finished without returning a report ID.");
  }

  return { reportId };
}

export async function fetchReportRunStatus(reportId: string): Promise<ReportRunStatus> {
  const canonicalReportId = requireReportId(reportId, "report.status");
  const freshReadInit = buildFreshReportReadInit();
  const data = await apiFetchJson<Record<string, unknown>>(
    "report.status",
    `/v1/reports/${encodeURIComponent(canonicalReportId)}/status`,
    {
      method: "GET",
      ...freshReadInit,
    },
  );

  return {
    reportId: normalizeReportId(data.report_id ?? data.reportId) ?? canonicalReportId,
    status: readNullableString(data.status) ?? "unknown",
    createdAt: readNullableString(data.created_at) ?? readNullableString(data.createdAt),
    updatedAt: readNullableString(data.updated_at) ?? readNullableString(data.updatedAt),
    startedAt: readNullableString(data.started_at) ?? readNullableString(data.startedAt),
    finishedAt: readNullableString(data.finished_at) ?? readNullableString(data.finishedAt),
    schemaVersion: readNullableString(data.schema_version) ?? readNullableString(data.schemaVersion),
    failureCode: readNullableString(data.failure_code) ?? readNullableString(data.failureCode),
    failureReason: readNullableString(data.failure_reason) ?? readNullableString(data.failureReason),
    stalledReason: readNullableString(data.stalled_reason) ?? readNullableString(data.stalledReason),
    lastErrorCode: readNullableString(data.last_error_code) ?? readNullableString(data.lastErrorCode),
    lastErrorMessage: readNullableString(data.last_error_message) ?? readNullableString(data.lastErrorMessage),
  };
}

export async function fetchReportArtifactJson(artifactJsonUrl: string): Promise<unknown> {
  const freshReadInit = buildFreshReportReadInit();
  return apiFetchJson<unknown>("report.artifact_json", artifactJsonUrl, {
    method: "GET",
    ...freshReadInit,
    headers: {
      Accept: "application/json",
    },
  });
}

export function resetReportsListCache() {
  reportListCache.clear();
  reportListInFlight.clear();
}

function normalizeListOffset(offset?: number | null): number | null {
  return typeof offset === "number" && Number.isFinite(offset) ? Math.max(0, Math.trunc(offset)) : null;
}

export async function fetchReportsList(offset?: number | null, options?: { forceRefresh?: boolean }): Promise<ReportListResult> {
  const forceRefresh = options?.forceRefresh ?? false;
  const normalizedOffset = normalizeListOffset(offset);
  const cacheKey = normalizedOffset ?? REPORT_LIST_DEFAULT_OFFSET_KEY;

  if (!forceRefresh) {
    const cached = reportListCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < REPORT_LIST_TTL_MS) {
      return cached.value;
    }

    const inFlight = reportListInFlight.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }
  }

  const requestPromise = (async () => {
    const path = normalizedOffset === null ? "/v1/reports" : `/v1/reports?offset=${encodeURIComponent(String(normalizedOffset))}`;
    const freshReadInit = buildFreshReportReadInit();
    const data = await apiFetchJson<Record<string, unknown>>("reports.list", path, {
      method: "GET",
      ...freshReadInit,
    });
    const normalized = normalizeReportsListResponse(data);
    reportListCache.set(cacheKey, { value: normalized, fetchedAt: Date.now() });
    return normalized;
  })();

  reportListInFlight.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    if (reportListInFlight.get(cacheKey) === requestPromise) {
      reportListInFlight.delete(cacheKey);
    }
  }
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

function parseContentLength(contentLength: string | null): number | null {
  if (!contentLength) {
    return null;
  }

  const trimmed = contentLength.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function validatePdfResponse(
  status: number,
  contentType: string | null,
  contentDisposition: string | null,
  contentLength: string | null,
  requireContentLength: boolean,
): void {
  const normalized = contentType?.toLowerCase().trim() ?? "";
  const isPdfContentType = normalized.startsWith("application/pdf");
  const isPdfOctetStream = normalized.startsWith("application/octet-stream") && hasPdfFilenameInContentDisposition(contentDisposition);
  if (!isPdfContentType && !isPdfOctetStream) {
    throw new Error(formatPdfContentTypeError(status, contentType));
  }

  const parsedContentLength = parseContentLength(contentLength);
  if (requireContentLength && parsedContentLength === null) {
    throw new Error("PDF endpoint did not provide a valid content-length header.");
  }

  if (parsedContentLength !== null && parsedContentLength <= 0) {
    throw new Error("PDF endpoint returned an empty content-length header value.");
  }
}

async function fetchPdfBlobFromAbsoluteUrl(
  operation: string,
  url: string,
): Promise<{
  blob: Blob;
  status: number;
  contentType: string | null;
  contentDisposition: string | null;
  contentLength: string | null;
  requireContentLength: boolean;
}> {
  const apiOrigin = getApiBaseOrigin();
  const urlOrigin = new URL(url).origin;
  if (urlOrigin === apiOrigin) {
    const result = await apiFetchBlobWithMeta(operation, url, { method: "GET", headers: { Accept: "application/pdf" } });
    return {
      ...result,
      requireContentLength: true,
    };
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
    contentLength: response.headers.get("content-length"),
    requireContentLength: false,
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
  validatePdfResponse(result.status, result.contentType, result.contentDisposition, result.contentLength, result.requireContentLength);
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
  validatePdfResponse(result.status, result.contentType, result.contentDisposition, result.contentLength, result.requireContentLength);
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

// ---------------------------------------------------------------------------
// Growth Report
// ---------------------------------------------------------------------------

export type GrowthReportAudienceMonthEntry = {
  month: string;
  followers_gained: number;
  followers_lost: number;
  impressions?: number;
  reach?: number;
  engagements?: number;
  video_views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  profile_views?: number;
};

export type GrowthReportYouTubeContent = {
  total_views: number;
  total_watch_time_hours: number;
  avg_impressions_ctr_pct: number | null;
  subscribers_gained_total: number | null;
  subscribers_lost_total: number | null;
  net_subscribers_change: number | null;
  date_range_start: string | null;
  date_range_end: string | null;
  has_subscriber_data: boolean;
  has_impressions_data: boolean;
};

export type GrowthReportConstraint = {
  constraint_type: string;
  severity: "high" | "medium" | "low";
  description: string;
  unlock_action: string;
};

export type GrowthReportUnlockItem = {
  platform: string;
  action: string;
  value_unlocked: string;
  priority: "high" | "medium" | "low";
};

export type GrowthReportAction = {
  action: string;
  reason: string;
  confidence: "high" | "medium" | "low";
  evidence_source: string;
};

export type GrowthReport = {
  entitlement_tier: "report" | "pro";
  growth_snapshot: {
    sources_available: string[];
    coverage_score: number;
    latest_period: string | null;
    has_audience_data: boolean;
    has_content_data: boolean;
  };
  what_we_can_measure: {
    audience_reach: boolean;
    content_performance: boolean;
    subscriber_trends: boolean;
    business_metrics: boolean;
    note: string;
  };
  audience_signals: {
    instagram: GrowthReportAudienceMonthEntry[];
    tiktok: GrowthReportAudienceMonthEntry[];
  };
  content_performance: {
    youtube: GrowthReportYouTubeContent | null;
    tiktok: GrowthReportAudienceMonthEntry[];
  };
  growth_constraints: GrowthReportConstraint[];
  what_unlocks_next: GrowthReportUnlockItem[];
  recommended_actions: GrowthReportAction[];
  confidence_note: {
    sources_used: string[];
    months_coverage: number;
    coverage_score: number;
    honesty_statement: string;
  };
};

export async function fetchGrowthReport(): Promise<GrowthReport> {
  return apiFetchJson<GrowthReport>("growth-report.fetch", "/v1/growth-report", {
    method: "GET",
    cache: "no-store",
  });
}

export function getReportErrorMessage(error: unknown): string {
  if (isEntitlementRequiredError(error)) {
    return "This action requires Report or Pro access. Continue in Billing to upgrade or restore access.";
  }

  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load report file.";
}
