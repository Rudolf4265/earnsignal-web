import { ApiError, apiFetchJson, getApiBaseOrigin, getApiBaseUrl } from "./client";
import type {
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
export type UploadStatusResponse = UploadStatusResponseSchema;
export type SourceManifestPlatform = {
  platform?: UploadPlatform;
  label?: string;
  descriptor?: string;
  accepted_file_types_label?: string;
  acceptedFileTypesLabel?: string;
  upload_help_text?: string;
  uploadHelpText?: string;
  public_support_status?: string;
  publicSupportStatus?: string;
  report_role?: string;
  reportRole?: string;
  standalone_report_eligible?: boolean;
  standaloneReportEligible?: boolean;
  business_metrics_capable?: boolean;
  businessMetricsCapable?: boolean;
  accepted_extensions?: string[];
  acceptedExtensions?: string[];
  public_contract_ids?: string[];
  publicContractIds?: string[];
  data_domains?: string[];
  dataDomains?: string[];
  role_summary?: string;
  roleSummary?: string;
  known_limitations?: string[];
  knownLimitations?: string[];
};
export type SourceManifestResponse = {
  version?: number | null;
  eligibility_rule?: string | null;
  eligibilityRule?: string | null;
  business_metrics_rule?: string | null;
  businessMetricsRule?: string | null;
  platforms?: SourceManifestPlatform[] | null;
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

/**
 * Returns true when the presigned URL is a local-storage file:// path.
 * Browsers cannot fetch() file:// URLs from an http(s) origin, so we must
 * route local uploads through the backend dev-put endpoint instead.
 */
function isLocalDevUrl(url: string): boolean {
  return url.startsWith("file://");
}

/**
 * Mirror of getBrowserAccessToken() in client.ts — fetches the active
 * Supabase session token so the dev-put request carries auth headers.
 */
async function _getBrowserAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const { createBrowserSupabaseClient } = await import("../supabase/client");
    const {
      data: { session },
    } = await createBrowserSupabaseClient().auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Uploads a file to the backend's dev-put endpoint.
 * Used in local storage mode where presigned URLs are file:// paths that
 * browsers cannot PUT to.  The endpoint writes the file to local disk and
 * is guarded (disabled in production) by _require_dev_uploads_enabled.
 */
async function uploadFileViaDevPut(uploadId: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);

  const url = `${getApiBaseUrl()}/v1/uploads/dev-put/${encodeURIComponent(uploadId)}`;
  const headers: Record<string, string> = {};

  const token = await _getBrowserAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Do NOT set Content-Type — the browser must set it automatically so that
  // the multipart boundary is included in the header value.
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Local dev file upload failed with status ${response.status}`);
  }
}

export async function uploadFileToPresignedUrl(params: {
  presignedUrl: string;
  file: File;
  headers?: Record<string, string>;
  /** Required when presignedUrl is a file:// local-storage URL. */
  uploadId?: string;
}): Promise<void> {
  // Local storage mode: presign returns file:// URLs which browsers cannot
  // fetch(). Route to the backend dev-put endpoint instead.
  if (isLocalDevUrl(params.presignedUrl)) {
    if (!params.uploadId) {
      throw new Error(
        "uploadId is required for local dev file upload but was not provided",
      );
    }
    await uploadFileViaDevPut(params.uploadId, params.file);
    return;
  }

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

export async function getUploadStatus(uploadId: string): Promise<UploadStatusResponse> {
  return apiFetchJson<UploadStatusResponse>("uploads.status", `/v1/uploads/${encodeURIComponent(uploadId)}/status`, {
    method: "GET",
  });
}

export async function getSourceManifest(): Promise<SourceManifestResponse> {
  return apiFetchJson<SourceManifestResponse>("uploads.sourceManifest", "/v1/source-manifest", {
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
