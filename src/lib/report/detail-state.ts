import { isEntitlementRequiredError } from "../api/client";
import { isSessionExpiredError } from "../auth/isSessionExpiredError";

export type ReportViewState = "loading" | "success" | "not_found" | "forbidden" | "entitlement_required" | "session_expired" | "server_error";

type ApiLikeError = {
  status?: unknown;
  requestId?: unknown;
};

function isApiLikeError(error: unknown): error is ApiLikeError {
  return Boolean(error && typeof error === "object" && "status" in error);
}

export function getReportViewState(error: unknown): ReportViewState {
  if (isEntitlementRequiredError(error)) {
    return "entitlement_required";
  }

  if (isApiLikeError(error) && typeof error.status === "number") {
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

  if (isSessionExpiredError(error, { hasAuthContext: true })) {
    return "session_expired";
  }

  return "server_error";
}

export function getRequestId(error: unknown): string | undefined {
  if (!isApiLikeError(error) || typeof error.requestId !== "string" || !error.requestId.trim()) {
    return undefined;
  }

  return error.requestId;
}
