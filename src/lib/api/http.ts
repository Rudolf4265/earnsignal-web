export class ApiResponseError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiResponseError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const DEFAULT_LOCAL_API_BASE_URL = "http://localhost:8000";

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.location !== "undefined";
}

function looksLikeHtml(text: string): boolean {
  const sample = text.trimStart().slice(0, 200).toLowerCase();
  return sample.startsWith("<!doctype html") || sample.startsWith("<html") || sample.includes("<head") || sample.includes("<body");
}

function isJsonContentType(contentType: string | null): boolean {
  if (!contentType) {
    return false;
  }

  const normalized = contentType.toLowerCase();
  return normalized.includes("application/json") || normalized.includes("+json");
}

function joinUrl(base: string, path: string): string {
  const normalizedBase = normalizeBaseUrl(base);

  if (!path) {
    return normalizedBase;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${normalizedBase}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configured) {
    return normalizeBaseUrl(configured);
  }

  if (isBrowser()) {
    const { host, hostname, protocol } = window.location;
    const effectiveHost = host && host.trim() ? host : hostname;

    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost")) {
      return DEFAULT_LOCAL_API_BASE_URL;
    }

    if (effectiveHost.startsWith("app.")) {
      return `https://api.${effectiveHost.slice(4)}`;
    }

    return `${protocol}//${effectiveHost}`;
  }

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) {
    if (vercelHost.startsWith("app.")) {
      return `https://api.${vercelHost.slice(4)}`;
    }

    return `https://${vercelHost}`;
  }

  return DEFAULT_LOCAL_API_BASE_URL;
}

export async function safeParseJsonResponse(res: Response, _context?: string): Promise<unknown> {
  if (res.status === 204) {
    return null;
  }

  let text = "";
  try {
    text = await res.text();
  } catch {
    return null;
  }

  if (!text.trim()) {
    return null;
  }

  const contentType = res.headers.get("content-type");
  const canAttemptJson = isJsonContentType(contentType) || text.trimStart().startsWith("{") || text.trimStart().startsWith("[");

  if (!canAttemptJson || looksLikeHtml(text)) {
    throw new ApiResponseError("Received a non-JSON response from the billing service.", res.status, "non_json_response", {
      contentType,
      sample: text.slice(0, 300),
    });
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiResponseError("Received malformed JSON from the billing service.", res.status, "invalid_json_response", {
      contentType,
      sample: text.slice(0, 300),
    });
  }
}

function buildContextError(context?: string, status?: number): string {
  if (!context) {
    return status ? `Request failed (HTTP ${status}).` : "Request failed.";
  }

  return status ? `Failed to fetch ${context} (HTTP ${status}).` : `Failed to fetch ${context}.`;
}

export async function fetchApiJson<T>(path: string, init: RequestInit = {}, context?: string): Promise<T> {
  const url = joinUrl(getApiBaseUrl(), path);

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
    });
  } catch (error) {
    throw new ApiResponseError(buildContextError(context), 0, "network_error", {
      url,
      cause: String(error),
    });
  }

  let parsed: unknown = null;
  try {
    parsed = await safeParseJsonResponse(response, context);
  } catch (error) {
    if (error instanceof ApiResponseError) {
      throw error;
    }

    throw new ApiResponseError(buildContextError(context, response.status), response.status, "parse_error", {
      url,
      cause: String(error),
    });
  }

  if (!response.ok) {
    let message = buildContextError(context, response.status);
    let code: string | undefined;
    let details: unknown = { url };

    if (parsed && typeof parsed === "object") {
      const envelope = parsed as Record<string, unknown>;
      const nestedError = envelope.error && typeof envelope.error === "object" ? (envelope.error as Record<string, unknown>) : null;

      if (typeof envelope.message === "string") {
        message = envelope.message;
      } else if (nestedError && typeof nestedError.message === "string") {
        message = nestedError.message;
      }

      if (typeof envelope.code === "string") {
        code = envelope.code;
      } else if (nestedError && typeof nestedError.code === "string") {
        code = nestedError.code;
      }

      details = envelope.details ?? envelope.error ?? envelope.errors ?? envelope;
    }

    throw new ApiResponseError(message, response.status, code, details);
  }

  if (parsed === null) {
    throw new ApiResponseError(`Billing service returned an empty response${context ? ` for ${context}` : ""}.`, response.status, "empty_response", {
      url,
    });
  }

  return parsed as T;
}
