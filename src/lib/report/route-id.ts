import { normalizeReportId } from "./id";

export type ReportRouteParams = {
  id?: string | string[];
};

export function readReportRouteParamId(params: ReportRouteParams | null | undefined): string | null {
  if (!params) {
    return null;
  }

  const raw = params.id;
  if (Array.isArray(raw)) {
    for (const candidate of raw) {
      const normalized = normalizeReportId(candidate);
      if (normalized) {
        return normalized;
      }
    }

    return null;
  }

  return normalizeReportId(raw);
}

