import { ApiError, apiFetchJson, getApiBaseOrigin } from "./client";

export type UploadPlatform =
  | "patreon"
  | "substack"
  | "youtube"
  | "instagram"
  | "tiktok"
  | "onlyfans";

export type PresignRequest = {
  platform: string;
  filename: string;
  content_type: string;
  size: number;
  checksum?: string;
  sha256?: string;
  content_md5?: string;
};

export type PresignResponse = {
  upload_id: string;
  object_key?: string;
  presigned_url: string;
  callback_url?: string;
  callback_proof?: Record<string, unknown> | string;
  headers?: Record<string, string>;
};

export type UploadCallbackRequest = {
  upload_id: string;
  success: boolean;
  size_bytes: number;
  callback_proof: Record<string, unknown> | string;
  platform: string;
  object_key?: string;
  filename: string;
  content_type: string;
  sha256?: string;
  content_md5?: string;
};

export type UploadCallbackResponse = {
  upload_id: string;
  status?: string;
  warnings?: string[];
};

export type GenerateReportRequest = {
  upload_id: string;
  platform: string;
};

export type GenerateReportResponse = {
  report_id: string;
  warnings?: string[];
};

export type UploadStatusResponse = {
  upload_id?: string;
  uploadId?: string;
  status?: string;
  reason_code?: string;
  reasonCode?: string;
  message?: string;
  report_id?: string;
  reportId?: string;
  updated_at?: string;
  updatedAt?: string;
};

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
  const data = await apiFetchJson<Record<string, unknown>>("uploads.presign", "/v1/uploads/presign", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    upload_id: (data.upload_id as string) ?? (data.uploadId as string),
    object_key: (data.object_key as string) ?? (data.objectKey as string) ?? undefined,
    presigned_url: (data.presigned_url as string) ?? (data.presign_url as string) ?? (data.url as string),
    callback_url: (data.callback_url as string) ?? (data.callbackUrl as string) ?? undefined,
    callback_proof: (data.callback_proof as Record<string, unknown> | string) ?? (data.callbackProof as Record<string, unknown> | string) ?? undefined,
    headers: (data.headers as Record<string, string>) ?? undefined,
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
  const data = await apiFetchJson<Record<string, unknown>>("uploads.callback", endpoint, {
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
  const data = await apiFetchJson<Record<string, unknown>>("reports.generate", "/v1/reports/generate", {
    method: "POST",
    body: JSON.stringify(payload),
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

export async function getLatestUploadStatus(): Promise<UploadStatusResponse> {
  return apiFetchJson<UploadStatusResponse>("uploads.latestStatus", "/v1/uploads/latest/status", {
    method: "GET",
  });
}

export { ApiError, normalizeCallbackPath };
