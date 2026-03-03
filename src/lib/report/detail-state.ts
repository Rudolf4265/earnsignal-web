import { isSessionExpiredError } from "../auth/isSessionExpiredError";

export type ReportViewState = "loading" | "success" | "invalid_link" | "not_found" | "forbidden" | "session_expired" | "server_error";

type ApiLikeError = {
  status?: unknown;
  requestId?: unknown;
  code?: unknown;
};

function isApiLikeError(error: unknown): error is ApiLikeError {
  return Boolean(error && typeof error === "object" && "status" in error);
}

export function getReportViewState(error: unknown): ReportViewState {
  if (isSessionExpiredError(error, { hasAuthContext: true })) {
    return "session_expired";
  }

  if (isApiLikeError(error) && typeof error.code === "string" && error.code === "invalid_report_id") {
    return "invalid_link";
  }

  if (!isApiLikeError(error) || typeof error.status !== "number") {
    return "server_error";
  }

  if (error.status === 401) {
    return "session_expired";
  }

  if (error.status === 403) {
    return "forbidden";
  }

  if (error.status === 404) {
    return "not_found";
  }

  if (error.status >= 500 || error.status === 0) {
    return "server_error";
  }

  return "server_error";
}

export function getRequestId(error: unknown): string | undefined {
  if (!isApiLikeError(error) || typeof error.requestId !== "string" || !error.requestId.trim()) {
    return undefined;
  }

  return error.requestId;
}

export function getStatusCode(error: unknown): number | undefined {
  if (!isApiLikeError(error) || typeof error.status !== "number") {
    return undefined;
  }

  return error.status;
}

export function getErrorCode(error: unknown): string | undefined {
  if (!isApiLikeError(error) || typeof error.code !== "string") {
    return undefined;
  }

  return error.code;
}
