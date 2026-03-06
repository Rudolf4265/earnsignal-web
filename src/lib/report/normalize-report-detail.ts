import { normalizeReportId } from "./id";

export type ReportDetail = {
  id: string;
  title: string;
  status: string;
  summary: string;
  createdAt?: string;
  updatedAt?: string;
  artifactUrl: string | null;
  pdfUrl: string | null;
  artifactJsonUrl: string | null;
  keySignals: string[];
  recommendedActions: string[];
  metrics: {
    netRevenue: number | null;
    subscribers: number | null;
    stabilityIndex: number | null;
    churnVelocity: number | null;
    coverageMonths: number | null;
    platformsConnected: number | null;
  };
};

function readString(record: Record<string, unknown>, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = readPath(record, key);
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return fallback;
}

function readPath(record: Record<string, unknown>, key: string): unknown {
  if (!key.includes(".")) {
    return record[key];
  }

  return key.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[part];
  }, record);
}

function readNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = readPath(record, key);
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (typeof entry === "string" && entry.trim()) {
        return entry.trim();
      }

      if (entry && typeof entry === "object") {
        const asRecord = entry as Record<string, unknown>;
        for (const key of ["title", "label", "text", "description", "summary", "value"]) {
          const candidate = asRecord[key];
          if (typeof candidate === "string" && candidate.trim()) {
            return candidate.trim();
          }
        }
      }

      return null;
    })
    .filter((entry): entry is string => Boolean(entry));
}

function readStringArray(record: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const values = toStringArray(readPath(record, key));
    if (values.length > 0) {
      return values;
    }
  }

  return [];
}

function findArtifactUrl(record: Record<string, unknown>): string | null {
  const direct = readString(
    record,
    [
      "artifact_url",
      "artifactUrl",
      "pdf_url",
      "pdfUrl",
      "report_pdf_url",
      "reportPdfUrl",
      "download_url",
      "downloadUrl",
      "pdf.url",
      "files.pdf_url",
      "files.pdfUrl",
    ],
    "",
  );

  if (direct) {
    return direct;
  }

  for (const listKey of ["artifacts", "files", "attachments", "report_files", "reportFiles", "report_body.files", "report_body.artifacts"]) {
    const list = readPath(record, listKey);
    if (!Array.isArray(list)) {
      continue;
    }

    for (const entry of list) {
      if (!entry || typeof entry !== "object") {
        continue;
      }

      const item = entry as Record<string, unknown>;
      const url =
        (typeof item.url === "string" && item.url) ||
        (typeof item.href === "string" && item.href) ||
        (typeof item.link === "string" && item.link) ||
        (typeof item.download_url === "string" && item.download_url) ||
        (typeof item.downloadUrl === "string" && item.downloadUrl) ||
        null;

      if (!url) {
        continue;
      }

      const type = typeof item.type === "string" ? item.type.toLowerCase() : "";
      const mime = typeof item.mime_type === "string" ? item.mime_type.toLowerCase() : typeof item.mimeType === "string" ? item.mimeType.toLowerCase() : "";
      const filename = typeof item.filename === "string" ? item.filename.toLowerCase() : typeof item.name === "string" ? item.name.toLowerCase() : "";
      if (type.includes("pdf") || mime.includes("pdf") || filename.endsWith(".pdf")) {
        return url;
      }
    }
  }

  return null;
}

export function normalizeReportDetail(reportId: string, payload: Record<string, unknown>): ReportDetail {
  const fallbackReportId = normalizeReportId(reportId) ?? "unknown";
  const normalizedReportId =
    normalizeReportId(readString(payload, ["id", "report_id", "reportId"], "")) ?? fallbackReportId;
  const platforms = readStringArray(payload, ["platforms", "sources", "report_body.platforms"]);
  const keySignals = readStringArray(payload, ["key_signals", "keySignals", "signals", "insights", "report_body.executive_summary.insights"]);
  const recommendedActions = readStringArray(payload, [
    "recommended_actions",
    "recommendedActions",
    "actions",
    "next_actions",
    "nextActions",
    "report_body.executive_summary.top_90_day_actions",
  ]);
  const artifactUrl = findArtifactUrl(payload);

  return {
    id: normalizedReportId,
    title: readString(payload, ["title", "name", "report_body.title"], `Report ${normalizedReportId}`),
    status: readString(payload, ["status"], "unknown"),
    summary: readString(
      payload,
      [
        "summary",
        "description",
        "message",
        "executive_summary.summary",
        "executive_summary.headline",
        "report_body.executive_summary.summary",
        "report_body.executive_summary.headline",
        "report_body.narrative.overview",
      ],
      "No summary available.",
    ),
    createdAt: readString(payload, ["created_at", "createdAt"]) || undefined,
    updatedAt: readString(payload, ["updated_at", "updatedAt"]) || undefined,
    artifactUrl,
    pdfUrl: artifactUrl,
    artifactJsonUrl: readString(payload, ["artifact_json_url", "artifactJsonUrl"], "") || null,
    keySignals,
    recommendedActions,
    metrics: {
      netRevenue: readNumber(payload, ["net_revenue", "metrics.net_revenue", "executive_summary.kpis.net_revenue", "report_body.executive_summary.kpis.net_revenue"]),
      subscribers: readNumber(payload, ["subscribers", "metrics.subscribers", "executive_summary.kpis.subscribers", "report_body.executive_summary.kpis.subscribers"]),
      stabilityIndex: readNumber(payload, ["stability_index", "metrics.stability_index", "risk_summary.stability_index", "report_body.risk_summary.stability_index"]),
      churnVelocity: readNumber(payload, [
        "churn_velocity",
        "metrics.churn_velocity",
        "risk_summary.components.churn",
        "report_body.risk_summary.components.churn",
      ]),
      coverageMonths: readNumber(payload, ["coverage_months", "metrics.coverage_months", "report_body.coverage_months", "report_body.coverage.months"]),
      platformsConnected: platforms.length > 0 ? platforms.length : readNumber(payload, ["platforms_connected", "metrics.platforms_connected"]),
    },
  };
}
