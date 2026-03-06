const INVALID_REPORT_ID_TOKENS = new Set(["undefined", "null", "nan"]);

export function normalizeReportId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (INVALID_REPORT_ID_TOKENS.has(trimmed.toLowerCase())) {
    return null;
  }

  return trimmed;
}

export function hasReportId(value: unknown): value is string {
  return normalizeReportId(value) !== null;
}
