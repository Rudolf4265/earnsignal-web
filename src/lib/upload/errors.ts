import { isEntitlementRequiredError } from "../api/client";
import { isSessionExpiredError } from "../auth/isSessionExpiredError";

export type UploadFailure = {
  reasonCode: string;
  message: string;
  shouldStopPolling: boolean;
  requestId: string | null;
  operation: string | null;
};

function isNetworkError(error: unknown): boolean {
  const code = typeof (error as { code?: unknown })?.code === "string" ? (error as { code: string }).code : null;
  // status === 0 with no requestId means the request never reached the server
  // (CORS blocked, no network, DNS failure, etc.)
  const status = typeof (error as { status?: unknown })?.status === "number" ? (error as { status: number }).status : null;
  return code === "NETWORK_ERROR" || (status === 0 && code !== "TIMEOUT" && code !== "ABORTED");
}

export function mapApiErrorToUploadFailure(error: unknown): UploadFailure {
  const status = typeof (error as { status?: unknown })?.status === "number" ? (error as { status: number }).status : null;
  const requestId = typeof (error as { requestId?: unknown })?.requestId === "string" ? (error as { requestId: string }).requestId : null;
  const operation = typeof (error as { operation?: unknown })?.operation === "string" ? (error as { operation: string }).operation : null;

  if (isNetworkError(error)) {
    return {
      reasonCode: "network_error",
      message: "We couldn't reach the server. Please retry.",
      shouldStopPolling: false,
      requestId,
      operation,
    };
  }

  if (isEntitlementRequiredError(error)) {
    return {
      reasonCode: "entitlement_required",
      message: "Paid report generation requires Report or Pro access. Continue in Billing to upgrade access.",
      shouldStopPolling: true,
      requestId,
      operation,
    };
  }

  if (isSessionExpiredError(error, { hasAuthContext: true })) {
    return {
      reasonCode: "session_expired",
      message: "Your session expired. Log in again, then return to upload status.",
      shouldStopPolling: true,
      requestId,
      operation,
    };
  }

  if (status !== null) {
    if (status === 404) {
      return {
        reasonCode: "upload_not_found",
        message: "That upload could not be found. It may have expired.",
        shouldStopPolling: true,
        requestId,
        operation,
      };
    }
  }

  return {
    reasonCode: "upload_failed",
    message: error instanceof Error ? error.message : "Unknown upload error",
    shouldStopPolling: false,
    requestId,
    operation,
  };
}
