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
const INVALID_REPORT_ID_TOKENS = new Set(["undefined", "null", "nan"]);

function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
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

function normalizeReportIdToken(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (INVALID_REPORT_ID_TOKENS.has(trimmed.toLowerCase())) {
    return null;
  }

  return trimmed;
}

function extractReportIdFromApiPath(path: string): string | null {
  let pathname = path;
  try {
    pathname = new URL(path, "https://api-path-check.local").pathname;
  } catch {
    return null;
  }

  const match = pathname.match(/^\/v1\/reports\/([^/?#]+)(?:\/artifact(?:\.json)?)?\/?$/i);
  if (!match) {
    return null;
  }

  let candidate = match[1];
  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    // Ignore malformed URI encoding and keep raw candidate.
  }

  return normalizeReportIdToken(candidate);
}

function assertNoInvalidReportPath(path: string, operation: string, method: string): void {
  let pathname = path;
  try {
    pathname = new URL(path, "https://api-path-check.local").pathname;
  } catch {
    return;
  }

  if (!/^\/v1\/reports\/[^/?#]+(?:\/artifact(?:\.json)?)?\/?$/i.test(pathname)) {
    return;
  }

  const reportId = extractReportIdFromApiPath(path);
  if (reportId) {
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.error("[api.client] blocked request with invalid report_id in report path.", {
      operation,
      method,
      path,
    });
  }

  throw new ApiError({
    status: 0,
    code: "INVALID_REPORT_ID",
    message: `Report ID is unavailable for ${operation}.`,
    operation,
    path,
    method,
  });
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
  const normalizedContentType = contentType ?? "unknown";

  if (!isJsonContentType(contentType) && !jsonLike) {
    return { __nonJsonText: text, __responseContentType: normalizedContentType };
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { __invalidJsonText: text, __responseContentType: normalizedContentType };
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

    if ("__nonJsonText" in body || "__invalidJsonText" in body) {
      details = body;
    }
  }

  return new ApiError({
    status: params.status,
    code,
    message,
    requestId: params.requestId,
    details,
    operation: params.operation,
    path: params.path,
    method: params.method,
  });
}

function normalizeSuccessPayload(parsed: unknown): unknown {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return parsed;
  }

  const body = parsed as Record<string, unknown>;
  const hasEnvelopeHints =
    typeof body.status === "string" ||
    typeof body.code === "string" ||
    "request_id" in body ||
    "requestId" in body;

  if (!hasEnvelopeHints) {
    return parsed;
  }

  const nested = body.details ?? body.data ?? body.result;
  if (!nested || typeof nested !== "object" || Array.isArray(nested)) {
    return parsed;
  }

  return {
    ...body,
    ...(nested as Record<string, unknown>),
  };
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
  assertNoInvalidReportPath(path, operation, method);
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

  return normalizeSuccessPayload(parsed) as T;
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

async function fetchBlob(operation: string, path: string, init: ApiFetchJsonInit = {}, withAuth: boolean): Promise<Blob> {
  const result = await fetchBlobWithMeta(operation, path, init, withAuth);
  return result.blob;
}

export type ApiBlobFetchResult = {
  blob: Blob;
  status: number;
  contentType: string | null;
  contentDisposition: string | null;
};

async function fetchBlobWithMeta(operation: string, path: string, init: ApiFetchJsonInit = {}, withAuth: boolean): Promise<ApiBlobFetchResult> {
  const method = init.method ?? "GET";
  const timeoutMs = init.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  assertNoInvalidReportPath(path, operation, method);
  const url = buildUrl(path);
  const { signal, cleanup, timedOut } = mergeSignals(init.signal, timeoutMs);

  const headers: Record<string, string> = {
    Accept: "application/pdf",
    ...(init.headers as Record<string, string> | undefined),
  };

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

  const requestId = response.headers.get("x-request-id") ?? undefined;

  if (!response.ok) {
    const parsed = await parseBody(response);
    cleanup();
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

  try {
    return {
      blob: await response.blob(),
      status: response.status,
      contentType: response.headers.get("content-type"),
      contentDisposition: response.headers.get("content-disposition"),
    };
  } finally {
    cleanup();
  }
}

export async function apiFetchBlob(operation: string, path: string, init: ApiFetchJsonInit = {}): Promise<Blob> {
  return fetchBlob(operation, path, init, true);
}

export async function publicFetchBlob(operation: string, path: string, init: ApiFetchJsonInit = {}): Promise<Blob> {
  return fetchBlob(operation, path, init, false);
}

export async function apiFetchBlobWithMeta(operation: string, path: string, init: ApiFetchJsonInit = {}): Promise<ApiBlobFetchResult> {
  return fetchBlobWithMeta(operation, path, init, true);
}

export async function publicFetchBlobWithMeta(operation: string, path: string, init: ApiFetchJsonInit = {}): Promise<ApiBlobFetchResult> {
  return fetchBlobWithMeta(operation, path, init, false);
}
