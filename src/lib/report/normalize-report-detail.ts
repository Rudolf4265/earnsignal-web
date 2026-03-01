export type ReportDetail = {
  id: string;
  title: string;
  status: string;
  summary: string;
  createdAt?: string;
  updatedAt?: string;
};

function readString(record: Record<string, unknown>, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return fallback;
}

export function normalizeReportDetail(reportId: string, payload: Record<string, unknown>): ReportDetail {
  return {
    id: readString(payload, ["id", "report_id", "reportId"], reportId),
    title: readString(payload, ["title", "name"], `Report ${reportId}`),
    status: readString(payload, ["status"], "unknown"),
    summary: readString(payload, ["summary", "description", "message"], "No summary available."),
    createdAt: readString(payload, ["created_at", "createdAt"]) || undefined,
    updatedAt: readString(payload, ["updated_at", "updatedAt"]) || undefined,
  };
}
