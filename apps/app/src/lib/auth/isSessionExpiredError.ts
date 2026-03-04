type SessionExpiredOptions = {
  hasAuthContext?: boolean;
};

export function isSessionExpiredError(error: unknown, options?: SessionExpiredOptions): boolean {
  const status = typeof (error as { status?: unknown })?.status === "number" ? (error as { status: number }).status : null;
  if (status === null) {
    return false;
  }

  if (status === 401) {
    return true;
  }

  if (status === 403 && options?.hasAuthContext === true) {
    return true;
  }

  return false;
}
