import { ApiError, apiFetchJson, getApiBaseOrigin } from "./client";
import type {
  ReportGenerateRequestSchema,
  ReportGenerateResponseSchema,
  UploadCallbackRequestSchema,
  UploadCallbackResponseSchema,
  UploadPresignRequestSchema,
  UploadPresignResponseSchema,
  UploadStatusResponseSchema,
} from "./generated";

export type UploadPlatform = UploadPresignRequestSchema["platform"];
export type PresignRequest = UploadPresignRequestSchema;
export type PresignResponse = Omit<UploadPresignResponseSchema, "upload_id" | "presigned_url"> & {
  upload_id: string;
  presigned_url: string;
};
export type UploadCallbackRequest = UploadCallbackRequestSchema;
export type UploadCallbackResponse = Omit<UploadCallbackResponseSchema, "upload_id"> & {
  upload_id: string;
};
export type GenerateReportRequest = ReportGenerateRequestSchema;
export type GenerateReportResponse = Omit<ReportGenerateResponseSchema, "report_id"> & {
  report_id: string;
};
export type UploadStatusResponse = UploadStatusResponseSchema;
export type UploadSupportMatrixFamily = {
  family?: string;
  label?: string;
  family_class?: string;
  familyClass?: string;
  is_user_visible_supported?: boolean;
  isUserVisibleSupported?: boolean;
  is_report_driving?: boolean;
  isReportDriving?: boolean;
  support_status?: string;
  supportStatus?: string;
  data_domains?: string[];
  dataDomains?: string[];
  known_limitations?: string[];
  knownLimitations?: string[];
};
export type UploadSupportMatrixResponse = {
  families?: UploadSupportMatrixFamily[] | null;
};
const LATEST_UPLOAD_STATUS_TTL_MS = 5_000;
let latestUploadStatusCache: { value: UploadStatusResponse; fetchedAt: number } | null = null;
let latestUploadStatusInFlight: Promise<UploadStatusResponse> | null = null;

function normalizeCallbackPath(callbackUrl?: string): string {
  const fallback = "/v1/uploads/callback";
  if (!callbackUrl) {
    return fallback;
  }

  if (!callbackUrl.startsWith("http://") && !callbackUrl.startsWith("https://")) {
    return callbackUrl;
  }

  try {
    const parsed = new URL(callbackUrl);
    if (parsed.origin !== getApiBaseOrigin()) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return fallback;
  }
}

export async function createUploadPresign(payload: PresignRequest): Promise<PresignResponse> {
  const data = await apiFetchJson<Partial<UploadPresignResponseSchema> & Record<string, unknown>>("uploads.presign", "/v1/uploads/presign", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    upload_id: (data.upload_id as string) ?? (data.uploadId as string),
    object_key: (data.object_key as string) ?? (data.objectKey as string) ?? undefined,
    presigned_url: (data.presigned_url as string) ?? (data.presign_url as string) ?? (data.url as string),
    callback_url: (data.callback_url as string) ?? (data.callbackUrl as string) ?? undefined,
    callback_proof: (data.callback_proof as Record<string, unknown> | string) ?? (data.callbackProof as Record<string, unknown> | string) ?? undefined,
    headers: ((data.headers as Record<string, string>) ?? (data.required_headers as Record<string, string>) ?? undefined),
  };
}

export async function uploadFileToPresignedUrl(params: {
  presignedUrl: string;
  file: File;
  headers?: Record<string, string>;
}): Promise<void> {
  const response = await fetch(params.presignedUrl, {
    method: "PUT",
    headers: params.headers,
    body: params.file,
  });

  if (!response.ok) {
    throw new Error(`Storage upload failed with status ${response.status}`);
  }
}

export async function finalizeUploadCallback(
  payload: UploadCallbackRequest,
  callbackUrl?: string,
): Promise<UploadCallbackResponse> {
  const endpoint = normalizeCallbackPath(callbackUrl);
  const data = await apiFetchJson<Partial<UploadCallbackResponseSchema> & Record<string, unknown>>("uploads.callback", endpoint, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    upload_id: (data.upload_id as string) ?? (data.uploadId as string) ?? payload.upload_id,
    status: (data.status as string) ?? undefined,
    warnings: (data.warnings as string[]) ?? undefined,
  };
}

export async function generateReport(payload: GenerateReportRequest): Promise<GenerateReportResponse> {
  const data = await apiFetchJson<Partial<ReportGenerateResponseSchema> & Record<string, unknown>>("reports.generate", "/v1/reports", {
    method: "POST",
    body: JSON.stringify({ upload_ids: [payload.upload_id] }),
  });

  return {
    report_id: (data.report_id as string) ?? (data.reportId as string),
    warnings: (data.warnings as string[]) ?? undefined,
  };
}

export async function getUploadStatus(uploadId: string): Promise<UploadStatusResponse> {
  return apiFetchJson<UploadStatusResponse>("uploads.status", `/v1/uploads/${encodeURIComponent(uploadId)}/status`, {
    method: "GET",
  });
}

export async function getUploadSupportMatrix(): Promise<UploadSupportMatrixResponse> {
  return apiFetchJson<UploadSupportMatrixResponse>("uploads.supportMatrix", "/v1/uploads/support-matrix", {
    method: "GET",
  });
}

export function resetLatestUploadStatusCache() {
  latestUploadStatusCache = null;
  latestUploadStatusInFlight = null;
}

export async function getLatestUploadStatus(options?: { forceRefresh?: boolean }): Promise<UploadStatusResponse> {
  const forceRefresh = options?.forceRefresh ?? false;

  if (!forceRefresh && latestUploadStatusCache && Date.now() - latestUploadStatusCache.fetchedAt < LATEST_UPLOAD_STATUS_TTL_MS) {
    return latestUploadStatusCache.value;
  }

  if (!forceRefresh && latestUploadStatusInFlight) {
    return latestUploadStatusInFlight;
  }

  latestUploadStatusInFlight = apiFetchJson<UploadStatusResponse>("uploads.latestStatus", "/v1/uploads/latest/status", {
    method: "GET",
  });

  try {
    const value = await latestUploadStatusInFlight;
    latestUploadStatusCache = { value, fetchedAt: Date.now() };
    return value;
  } finally {
    latestUploadStatusInFlight = null;
  }
}

export { ApiError, normalizeCallbackPath };
