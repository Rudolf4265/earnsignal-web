export type UploadFailure = {
  reasonCode: string;
  message: string;
  shouldStopPolling: boolean;
};

export function mapApiErrorToUploadFailure(error: unknown): UploadFailure {
  const status = typeof (error as { status?: unknown })?.status === "number" ? (error as { status: number }).status : null;

  if (status !== null) {
    if (status === 401 || status === 403) {
      return {
        reasonCode: "session_expired",
        message: "Your session expired. Log in again, then return to upload status.",
        shouldStopPolling: true,
      };
    }

    if (status === 404) {
      return {
        reasonCode: "upload_not_found",
        message: "That upload could not be found. It may have expired.",
        shouldStopPolling: true,
      };
    }
  }

  return {
    reasonCode: "upload_failed",
    message: error instanceof Error ? error.message : "Unknown upload error",
    shouldStopPolling: false,
  };
}
