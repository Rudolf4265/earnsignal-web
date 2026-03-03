export type ApiErrorParams = {
  status: number;
  code: string;
  message: string;
  requestId?: string;
  details?: unknown;
  operation: string;
  path: string;
  method: string;
};

export class ApiError extends Error {
  status: number;
  code: string;
  requestId?: string;
  request_id?: string;
  details?: unknown;
  operation: string;
  path: string;
  method: string;

  constructor(params: ApiErrorParams) {
    super(params.message);
    this.name = "ApiError";
    this.status = params.status;
    this.code = params.code;
    this.requestId = params.requestId;
    this.request_id = params.requestId;
    this.details = params.details;
    this.operation = params.operation;
    this.path = params.path;
    this.method = params.method;
  }
}

export type ApiFetchJsonInit = Omit<RequestInit, "signal"> & {
  signal?: AbortSignal;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 30_000;

function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "");
}

function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!configured) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_BASE_URL. Set NEXT_PUBLIC_API_BASE_URL (for example: https://api.your-domain.com) before making API requests.",
    );
  }

  return normalizeBaseUrl(configured);
}

function buildUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const base = getApiBaseUrl();
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function getBrowserAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const { createClient } = await import("../supabase/client");
    const {
      data: { session },
    } = await createClient().auth.getSession();

    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

function isJsonContentType(contentType: string | null): boolean {
  if (!contentType) {
    return false;
  }

  const normalized = contentType.toLowerCase();
  return normalized.includes("application/json") || normalized.includes("+json");
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text.trim()) {
    return null;
  }

  const contentType = response.headers.get("content-type");
  const jsonLike = text.trimStart().startsWith("{") || text.trimStart().startsWith("[");

  if (!isJsonContentType(contentType) && !jsonLike) {
    return { __nonJsonText: text };
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { __invalidJsonText: text };
  }
}

function buildApiError(params: {
  operation: string;
  path: string;
  method: string;
  status: number;
  requestId?: string;
  parsed: unknown;
  fallbackMessage: string;
}): ApiError {
  let message = params.fallbackMessage;
  let code = params.status > 0 ? `HTTP_${params.status}` : "NETWORK_ERROR";
  let details: unknown = undefined;
  let requestId = params.requestId;

  if (params.parsed && typeof params.parsed === "object") {
    const body = params.parsed as Record<string, unknown>;
    const nestedError = body.error && typeof body.error === "object" ? (body.error as Record<string, unknown>) : null;

    if (typeof body.message === "string") {
      message = body.message;
    } else if (typeof body.detail === "string") {
      message = body.detail;
    } else if (nestedError && typeof nestedError.message === "string") {
      message = nestedError.message;
    }

    if (typeof body.code === "string") {
      code = body.code;
    } else if (typeof body.reason_code === "string") {
      code = body.reason_code;
    } else if (nestedError && typeof nestedError.code === "string") {
      code = nestedError.code;
    }

    details = body.details ?? body.error ?? body.errors;

    if (typeof body.request_id === "string" && body.request_id.trim()) {
      requestId = body.request_id;
    } else if (nestedError && typeof nestedError.request_id === "string" && nestedError.request_id.trim()) {
      requestId = nestedError.request_id;
    }

    if ("__nonJsonText" in body || "__invalidJsonText" in body) {
      details = body;
    }
  }

  return new ApiError({
    status: params.status,
    code,
    message,
    requestId,
    details,
    operation: params.operation,
    path: params.path,
    method: params.method,
  });
}

function mergeSignals(signal: AbortSignal | undefined, timeoutMs: number): { signal: AbortSignal; cleanup: () => void; timedOut: () => boolean } {
  const controller = new AbortController();
  let timeoutTriggered = false;

  const timeoutId = setTimeout(() => {
    timeoutTriggered = true;
    controller.abort();
  }, timeoutMs);

  const onAbort = () => {
    controller.abort();
  };

  signal?.addEventListener("abort", onAbort);

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onAbort);
    },
    timedOut: () => timeoutTriggered,
  };
}

async function fetchJson<T>(
  operation: string,
  path: string,
  init: ApiFetchJsonInit = {},
  withAuth: boolean,
): Promise<T> {
  const method = init.method ?? "GET";
  const timeoutMs = init.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const url = buildUrl(path);
  const { signal, cleanup, timedOut } = mergeSignals(init.signal, timeoutMs);

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  if (init.body !== undefined && init.body !== null && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (withAuth) {
    const token = await getBrowserAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      method,
      headers,
      signal,
    });
  } catch (error) {
    cleanup();

    if (timedOut()) {
      throw new ApiError({
        status: 0,
        code: "TIMEOUT",
        message: `Request timed out after ${timeoutMs}ms.`,
        operation,
        path,
        method,
      });
    }

    if (init.signal?.aborted) {
      throw new ApiError({
        status: 0,
        code: "ABORTED",
        message: "Request was aborted.",
        operation,
        path,
        method,
      });
    }

    throw new ApiError({
      status: 0,
      code: "NETWORK_ERROR",
      message: "Network request failed.",
      details: String(error),
      operation,
      path,
      method,
    });
  }

  cleanup();

  const requestId = response.headers.get("x-request-id") ?? undefined;
  const parsed = await parseBody(response);

  if (!response.ok) {
    throw buildApiError({
      operation,
      path,
      method,
      status: response.status,
      requestId,
      parsed,
      fallbackMessage: `Request failed with status ${response.status}.`,
    });
  }

  if (parsed === null) {
    return null as T;
  }

  if (typeof parsed === "object" && parsed && ("__nonJsonText" in parsed || "__invalidJsonText" in parsed)) {
    throw new ApiError({
      status: response.status,
      code: "INVALID_JSON_RESPONSE",
      message: "Expected JSON response but received invalid payload.",
      requestId,
      details: parsed,
      operation,
      path,
      method,
    });
  }

  return parsed as T;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getApiBaseOrigin(): string {
  return new URL(getApiBaseUrl()).origin;
}

export async function apiFetchJson<T>(operation: string, path: string, init: ApiFetchJsonInit = {}): Promise<T> {
  return fetchJson<T>(operation, path, init, true);
}

export async function publicFetchJson<T>(operation: string, path: string, init: ApiFetchJsonInit = {}): Promise<T> {
  return fetchJson<T>(operation, path, init, false);
}
