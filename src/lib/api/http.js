const DEFAULT_LOCAL_API_BASE_URL = "http://localhost:8000";
const DEFAULT_PROD_API_BASE_URL = "https://api.earnsigma.com";

function cleanBaseUrl(value) {
  return value.replace(/\/$/, "");
}

export function getApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (configured) {
    return cleanBaseUrl(configured);
  }

  if (typeof window === "undefined") {
    return "";
  }

  const location = window.location;
  if (!location) {
    return "";
  }

  const { hostname, protocol } = location;
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost")) {
    return DEFAULT_LOCAL_API_BASE_URL;
  }

  if (hostname.startsWith("app.")) {
    const derivedHost = `api.${hostname.slice(4)}`;
    return cleanBaseUrl(`${protocol}//${derivedHost}`);
  }

  return DEFAULT_PROD_API_BASE_URL;
}

export function buildApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

export class ApiResponseError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiResponseError";
    this.status = status;
  }
}

export async function safeParseJsonResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const raw = await response.text();
  if (!raw.trim()) {
    return null;
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const looksLikeJson = contentType.includes("application/json") || raw.trim().startsWith("{") || raw.trim().startsWith("[");

  if (!looksLikeJson) {
    throw new Error("Received a non-JSON response from the billing service.");
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Received malformed JSON from the billing service.");
  }
}

export async function fetchApiJson(path, init, errorLabel) {
  const response = await fetch(buildApiUrl(path), init);

  let parsed = null;
  try {
    parsed = await safeParseJsonResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : `Unable to load ${errorLabel}.`;
    throw new ApiResponseError(message, response.status);
  }

  if (!response.ok) {
    throw new ApiResponseError(`Unable to load ${errorLabel} (${response.status}).`, response.status);
  }

  if (parsed === null) {
    throw new ApiResponseError(`Billing service returned an empty response for ${errorLabel}.`, response.status);
  }

  return parsed;
}
