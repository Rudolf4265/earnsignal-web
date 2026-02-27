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

export class ApiError extends Error {
  status: number;
  code: string | null;

  constructor(message: string, status: number, code?: string | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code ?? null;
  }
}

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

async function apiFetch<T>(path: string, init: RequestInit): Promise<T> {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const bodyText = await response.text();
    let message = bodyText || `Request failed with status ${response.status}`;
    let code: string | null = null;

    try {
      const body = JSON.parse(bodyText) as { detail?: string; message?: string; code?: string; reason_code?: string };
      message = body.message ?? body.detail ?? message;
      code = body.code ?? body.reason_code ?? null;
    } catch {
      // keep plain-text message fallback
    }

    throw new ApiError(message, response.status, code);
  }

  return (await response.json()) as T;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const { createClient } = await import("../supabase/client");
    const {
      data: { session },
    } = await createClient().auth.getSession();
    const accessToken = session?.access_token;

    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  } catch {
    return {};
  }
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

export async function getUploadStatus(uploadId: string): Promise<UploadStatusResponse> {
  return apiFetch<UploadStatusResponse>(`/v1/uploads/${encodeURIComponent(uploadId)}/status`, {
    method: "GET",
  });
}

export async function getLatestUploadStatus(): Promise<UploadStatusResponse> {
  return apiFetch<UploadStatusResponse>("/v1/uploads/latest/status", {
    method: "GET",
  });
}
