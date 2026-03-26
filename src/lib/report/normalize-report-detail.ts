import { normalizeReportId } from "./id";
import {
  normalizeArtifactToReportModel,
  type ReportDiagnosisViewModel,
  type ReportWhatChangedViewModel,
} from "./normalize-artifact-to-report-model";
import {
  buildCanonicalReportTitle,
  normalizePlatformsIncluded,
  resolveReportKind,
  resolveReportSourceCount,
  type ReportKind,
} from "./source-labeling";

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
  diagnosis: ReportDiagnosisViewModel | null;
  whatChanged: ReportWhatChangedViewModel | null;
  platformsIncluded: string[];
  sourceCount: number | null;
  reportKind: ReportKind;
  snapshotWindowMode: string | null;
  snapshotCoverageNote: string | null;
  youtubeContributionMode: string | null;
  reportHasBusinessMetrics: boolean;
  sectionStrength: Array<{
    id: string;
    label: string;
    level: "strong" | "medium" | "weak";
    reason: string | null;
  }>;
  metrics: {
    netRevenue: number | null;
    subscribers: number | null;
    stabilityIndex: number | null;
    churnVelocity: number | null;
    coverageMonths: number | null;
    platformsConnected: number | null;
  };
};

function normalizeSectionStrengthLabel(key: string): string {
  if (key === "subscriber_health") {
    return "Subscriber health";
  }
  if (key === "platform_mix") {
    return "Platform mix";
  }
  return key
    .split("_")
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeSectionStrengthEntries(payload: Record<string, unknown>): ReportDetail["sectionStrength"] {
  const raw =
    payload["section_strength"] ??
    payload["sectionStrength"] ??
    (payload["report"] as Record<string, unknown> | undefined)?.["section_strength"];

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return [];
  }

  return Object.entries(raw as Record<string, unknown>)
    .map(([id, value]) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
      }

      const record = value as Record<string, unknown>;
      const levelRaw = readString(record, ["level"], "").toLowerCase();
      const level = levelRaw === "strong" || levelRaw === "medium" ? levelRaw : "weak";

      return {
        id,
        label: normalizeSectionStrengthLabel(id),
        level,
        reason: readString(record, ["reason"], "") || null,
      };
    })
    .filter((entry): entry is ReportDetail["sectionStrength"][number] => entry !== null);
}

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

function readPositiveCount(record: Record<string, unknown>, keys: string[]): number | null {
  const value = readNumber(record, keys);
  return value !== null && value > 0 ? Math.trunc(value) : null;
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
  const typedReportModel = normalizeArtifactToReportModel(payload).model;
  const createdAt = readString(payload, ["created_at", "createdAt"]) || undefined;
  const updatedAt = readString(payload, ["updated_at", "updatedAt"]) || undefined;
  const coverageStart = readString(payload, [
    "coverage_start",
    "coverageStart",
    "report.coverage_start",
    "report.coverageStart",
    "report.trend_preview.coverage_start",
    "report.trend_preview.coverageStart",
  ]);
  const coverageEnd = readString(payload, [
    "coverage_end",
    "coverageEnd",
    "report.coverage_end",
    "report.coverageEnd",
    "report.trend_preview.coverage_end",
    "report.trend_preview.coverageEnd",
  ]);
  const platformsIncluded = normalizePlatformsIncluded(
    readStringArray(payload, [
      "platforms_included",
      "platformsIncluded",
      "platforms",
      "sources",
      "report_body.platforms_included",
      "report_body.platformsIncluded",
      "report_body.platforms",
      "report.platforms_included",
      "report.platformsIncluded",
      "report.platforms",
      "report.sources",
      "report.report_body.platforms_included",
      "report.report_body.platformsIncluded",
      "report.report_body.platforms",
      "report.trend_preview.platforms_included",
      "report.trend_preview.platformsIncluded",
      "report.trend_preview.platforms",
      "report.trend_preview.sources",
    ]),
  );
  const sourceCount = resolveReportSourceCount({
    platformsIncluded,
    sourceCount: readPositiveCount(payload, [
      "source_count",
      "sourceCount",
      "included_source_count",
      "includedSourceCount",
      "platforms_connected",
      "metrics.platforms_connected",
      "report.source_count",
      "report.sourceCount",
      "report.included_source_count",
      "report.includedSourceCount",
      "report.platforms_connected",
      "report.metrics.platforms_connected",
      "report.trend_preview.source_count",
      "report.trend_preview.sourceCount",
      "report.trend_preview.included_source_count",
      "report.trend_preview.includedSourceCount",
      "report.trend_preview.platforms_connected",
      "report.trend_preview.metrics.platforms_connected",
      "report.trend_preview.inputs.source_count",
      "report.trend_preview.inputs.sourceCount",
      "report.trend_preview.inputs.platforms_connected",
    ]),
  });
  const reportKind = resolveReportKind({ platformsIncluded, sourceCount });
  const title = buildCanonicalReportTitle({
    createdAt,
    coverageEnd,
    coverageStart,
    platformsIncluded,
    sourceCount,
    updatedAt,
  });
  const keySignals = readStringArray(payload, [
    "key_signals",
    "keySignals",
    "signals",
    "insights",
    "report_body.executive_summary.insights",
    "report.key_signals",
    "report.keySignals",
    "report.signals",
    "report.insights",
    "report.executive_summary.insights",
    "report.report_body.executive_summary.insights",
    "report.trend_preview.key_signals",
    "report.trend_preview.keySignals",
    "report.trend_preview.signals",
    "report.trend_preview.insights",
    "report.trend_preview.inputs.key_signals",
    "report.trend_preview.inputs.keySignals",
  ]);
  const recommendedActions = readStringArray(payload, [
    "recommended_actions",
    "recommendedActions",
    "actions",
    "next_actions",
    "nextActions",
    "report_body.executive_summary.top_90_day_actions",
    "report.recommended_actions",
    "report.recommendedActions",
    "report.actions",
    "report.next_actions",
    "report.nextActions",
    "report.executive_summary.top_90_day_actions",
    "report.report_body.executive_summary.top_90_day_actions",
    "report.trend_preview.recommended_actions",
    "report.trend_preview.recommendedActions",
    "report.trend_preview.actions",
    "report.trend_preview.next_actions",
    "report.trend_preview.nextActions",
    "report.trend_preview.inputs.recommended_actions",
    "report.trend_preview.inputs.recommendedActions",
  ]);
  const artifactUrl = findArtifactUrl(payload);

  return {
    id: normalizedReportId,
    title,
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
        "report.summary",
        "report.description",
        "report.message",
        "report.executive_summary.summary",
        "report.executive_summary.headline",
        "report.report_body.executive_summary.summary",
        "report.report_body.executive_summary.headline",
        "report.report_body.narrative.overview",
        "report.trend_preview.summary",
        "report.trend_preview.headline",
        "report.trend_preview.overview",
      ],
      "No summary available.",
    ),
    createdAt,
    updatedAt,
    artifactUrl,
    pdfUrl: artifactUrl,
    artifactJsonUrl: readString(payload, ["artifact_json_url", "artifactJsonUrl"], "") || null,
    keySignals,
    recommendedActions,
    diagnosis: typedReportModel.diagnosis,
    whatChanged: typedReportModel.whatChanged,
    platformsIncluded,
    sourceCount,
    reportKind,
    snapshotWindowMode: readString(payload, ["snapshot_window_mode", "snapshotWindowMode", "report.snapshot_window_mode"]) || null,
    snapshotCoverageNote: readString(payload, ["snapshot_coverage_note", "snapshotCoverageNote", "report.snapshot_coverage_note"]) || null,
    youtubeContributionMode: readString(payload, ["youtube_contribution_mode", "youtubeContributionMode", "report.youtube_contribution_mode"]) || null,
    reportHasBusinessMetrics: (() => {
      const raw = payload["report_has_business_metrics"] ?? payload["reportHasBusinessMetrics"] ?? (payload["report"] as Record<string, unknown> | undefined)?.["report_has_business_metrics"];
      return raw === false ? false : true;
    })(),
    sectionStrength: normalizeSectionStrengthEntries(payload),
    metrics: {
      netRevenue: readNumber(payload, [
        "net_revenue",
        "metrics.net_revenue",
        "executive_summary.kpis.net_revenue",
        "report_body.executive_summary.kpis.net_revenue",
        "report.net_revenue",
        "report.metrics.net_revenue",
        "report.executive_summary.kpis.net_revenue",
        "report.report_body.executive_summary.kpis.net_revenue",
        "report.trend_preview.net_revenue",
        "report.trend_preview.metrics.net_revenue",
        "report.trend_preview.kpis.net_revenue",
        "report.trend_preview.inputs.net_revenue",
      ]),
      subscribers: readNumber(payload, [
        "subscribers",
        "metrics.subscribers",
        "executive_summary.kpis.subscribers",
        "report_body.executive_summary.kpis.subscribers",
        "report.subscribers",
        "report.metrics.subscribers",
        "report.executive_summary.kpis.subscribers",
        "report.report_body.executive_summary.kpis.subscribers",
        "report.trend_preview.subscribers",
        "report.trend_preview.metrics.subscribers",
        "report.trend_preview.kpis.subscribers",
        "report.trend_preview.inputs.subscribers",
      ]),
      stabilityIndex: readNumber(payload, [
        "stability_index",
        "metrics.stability_index",
        "risk_summary.stability_index",
        "report_body.risk_summary.stability_index",
        "report.stability_index",
        "report.metrics.stability_index",
        "report.risk_summary.stability_index",
        "report.report_body.risk_summary.stability_index",
        "report.trend_preview.stability_index",
        "report.trend_preview.metrics.stability_index",
        "report.trend_preview.kpis.stability_index",
        "report.trend_preview.inputs.stability_index",
      ]),
      churnVelocity: readNumber(payload, [
        "churn_velocity",
        "metrics.churn_velocity",
        "risk_summary.components.churn",
        "report_body.risk_summary.components.churn",
        "report.churn_velocity",
        "report.metrics.churn_velocity",
        "report.risk_summary.components.churn",
        "report.report_body.risk_summary.components.churn",
        "report.trend_preview.churn_velocity",
        "report.trend_preview.metrics.churn_velocity",
        "report.trend_preview.kpis.churn_velocity",
        "report.trend_preview.inputs.churn_velocity",
      ]),
      coverageMonths: readNumber(payload, [
        "coverage_months",
        "metrics.coverage_months",
        "report_body.coverage_months",
        "report_body.coverage.months",
        "report.coverage_months",
        "report.metrics.coverage_months",
        "report.report_body.coverage_months",
        "report.report_body.coverage.months",
        "report.trend_preview.coverage_months",
        "report.trend_preview.coverage.months",
        "report.trend_preview.inputs.coverage_months",
      ]),
      platformsConnected: sourceCount,
    },
  };
}
