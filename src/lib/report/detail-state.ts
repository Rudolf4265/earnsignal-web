export type ReportViewState = "loading" | "success" | "not_found" | "forbidden" | "session_expired" | "server_error";

type ApiLikeError = {
  status?: unknown;
  requestId?: unknown;
};

function isApiLikeError(error: unknown): error is ApiLikeError {
  return Boolean(error && typeof error === "object" && "status" in error);
}

export function getReportViewState(error: unknown): ReportViewState {
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
