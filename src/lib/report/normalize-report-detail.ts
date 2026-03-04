export type ReportDetail = {
  id: string;
  title: string;
  status: string;
  summary: string;
  createdAt?: string;
  updatedAt?: string;
  artifactUrl?: string;
  artifactJsonUrl?: string;
  artifactKind?: string;
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
  const id = readString(payload, ["report_id", "reportId", "id"], reportId);

  return {
    id,
    title: readString(payload, ["title", "name"], `Report ${id}`),
    status: readString(payload, ["status"], "unknown"),
    summary: readString(payload, ["summary", "description", "message"], "No summary available."),
    createdAt: readString(payload, ["created_at", "createdAt"]) || undefined,
    updatedAt: readString(payload, ["updated_at", "updatedAt"]) || undefined,
    artifactUrl: readString(payload, ["artifact_url", "artifactUrl"]) || undefined,
    artifactJsonUrl: readString(payload, ["artifact_json_url", "artifactJsonUrl"]) || undefined,
    artifactKind: readString(payload, ["artifact_kind", "artifactKind"]) || undefined,
  };
}
