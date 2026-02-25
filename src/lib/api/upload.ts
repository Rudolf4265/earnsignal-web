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
  sha256?: string;
  content_md5?: string;
};

export type PresignResponse = {
  upload_id: string;
  object_key?: string;
  presigned_url: string;
  callback_url?: string;
  headers?: Record<string, string>;
};

export type UploadCallbackRequest = {
  upload_id: string;
  platform: string;
  object_key?: string;
  filename: string;
  size: number;
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

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

async function apiFetch<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function createUploadPresign(payload: PresignRequest): Promise<PresignResponse> {
  const data = await apiFetch<Record<string, unknown>>("/v1/uploads/presign", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    upload_id: (data.upload_id as string) ?? (data.uploadId as string),
    object_key: (data.object_key as string) ?? (data.objectKey as string) ?? undefined,
    presigned_url: (data.presigned_url as string) ?? (data.presign_url as string) ?? (data.url as string),
    callback_url: (data.callback_url as string) ?? (data.callbackUrl as string) ?? undefined,
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
  const endpoint = callbackUrl ?? "/v1/uploads/callback";
  const data = await apiFetch<Record<string, unknown>>(endpoint, {
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
  const data = await apiFetch<Record<string, unknown>>("/v1/reports/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return {
    report_id: (data.report_id as string) ?? (data.reportId as string),
    warnings: (data.warnings as string[]) ?? undefined,
  };
}
