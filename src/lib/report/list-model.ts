import { normalizeReportId } from "./id";
import { buildReportDetailPath } from "./path";

export type ReportListItem = {
  reportId: string | null;
  status: string;
  createdAt: string | null;
  finishedAt: string | null;
  artifactUrl: string | null;
  artifactJsonUrl: string | null;
  uploadId: string | null;
  jobId: string | null;
  schemaVersion: string | null;
  title: string | null;
  platforms: string[] | null;
  coverageStart: string | null;
  coverageEnd: string | null;
};

export type ReportListResult = {
  items: ReportListItem[];
  nextOffset: number | null;
  hasMore: boolean;
};

export type ReportListRow = {
  id: string;
  reportId: string | null;
  title: string;
  status: string;
  statusLabel: string;
  statusVariant: "good" | "warn" | "neutral";
  createdAtLabel: string;
  viewHref: string | null;
  canView: boolean;
  canDownload: boolean;
  artifactUrl: string | null;
};

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.trunc(parsed);
    }
  }

  return null;
}

function readBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  return null;
}

function readStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const values = value
    .map((entry) => readString(entry))
    .filter((entry): entry is string => entry !== null);

  return values.length > 0 ? values : null;
}

function readItemsFromRecord(record: Record<string, unknown>): unknown[] {
  if (Array.isArray(record.items)) {
    return record.items;
  }

  if (Array.isArray(record.reports)) {
    return record.reports;
  }

  return [];
}

function readItemsSource(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const direct = readItemsFromRecord(record);
  if (direct.length > 0) {
    return direct;
  }

  // Some backends wrap list data under data/result/details without envelope hints.
  const wrapped = record.data ?? record.result ?? record.details;
  if (!wrapped || typeof wrapped !== "object" || Array.isArray(wrapped)) {
    return direct;
  }

  return readItemsFromRecord(wrapped as Record<string, unknown>);
}

function normalizeItem(raw: unknown): ReportListItem | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const reportId = normalizeReportId(record.report_id) ?? normalizeReportId(record.reportId);

  return {
    reportId,
    status: readString(record.status) ?? "unknown",
    createdAt: readString(record.created_at) ?? readString(record.createdAt),
    finishedAt: readString(record.finished_at) ?? readString(record.finishedAt),
    artifactUrl: readString(record.artifact_url) ?? readString(record.artifactUrl),
    artifactJsonUrl: readString(record.artifact_json_url) ?? readString(record.artifactJsonUrl),
    uploadId: readString(record.upload_id) ?? readString(record.uploadId),
    jobId: readString(record.job_id) ?? readString(record.jobId),
    schemaVersion: readString(record.schema_version) ?? readString(record.schemaVersion),
    title: readString(record.title),
    platforms: readStringArray(record.platforms),
    coverageStart: readString(record.coverage_start) ?? readString(record.coverageStart),
    coverageEnd: readString(record.coverage_end) ?? readString(record.coverageEnd),
  };
}

export function normalizeReportsListResponse(payload: unknown): ReportListResult {
  const source = readItemsSource(payload);
  const items = source.map((entry) => normalizeItem(entry)).filter((entry): entry is ReportListItem => entry !== null);
  const metadata = !payload || typeof payload !== "object" || Array.isArray(payload) ? {} : (payload as Record<string, unknown>);
  const wrappedMetadata =
    metadata.data && typeof metadata.data === "object" && !Array.isArray(metadata.data)
      ? (metadata.data as Record<string, unknown>)
      : metadata.result && typeof metadata.result === "object" && !Array.isArray(metadata.result)
        ? (metadata.result as Record<string, unknown>)
        : metadata.details && typeof metadata.details === "object" && !Array.isArray(metadata.details)
          ? (metadata.details as Record<string, unknown>)
          : null;

  const nextOffset =
    readNumber(metadata.next_offset) ??
    readNumber(metadata.nextOffset) ??
    readNumber(wrappedMetadata?.next_offset) ??
    readNumber(wrappedMetadata?.nextOffset);
  const hasMore =
    readBoolean(metadata.has_more) ??
    readBoolean(metadata.hasMore) ??
    readBoolean(wrappedMetadata?.has_more) ??
    readBoolean(wrappedMetadata?.hasMore) ??
    nextOffset !== null;

  return {
    items,
    nextOffset,
    hasMore,
  };
}

export function computeHasReportsFromListResult(result: Pick<ReportListResult, "items">): boolean {
  return result.items.some((item) => item.reportId !== null);
}

export function computeHasReportsFromListResponse(payload: unknown): boolean {
  return computeHasReportsFromListResult(normalizeReportsListResponse(payload));
}

export function formatReportCreatedAt(value: string | null | undefined): string {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function toReportStatusVariant(status: string): "good" | "warn" | "neutral" {
  const normalized = status.toLowerCase();
  if (["ready", "completed", "complete", "success", "succeeded"].includes(normalized)) {
    return "good";
  }

  if (["failed", "error", "rejected", "validation_failed", "report_failed"].includes(normalized)) {
    return "warn";
  }

  return "neutral";
}

export function toReportStatusLabel(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === "ready") {
    return "Ready";
  }

  if (normalized === "processing") {
    return "Processing";
  }

  if (!status.trim()) {
    return "Unknown";
  }

  return status
    .split(/[_\s-]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function toReportListRows(items: ReportListItem[]): ReportListRow[] {
  return items.map((item, index) => {
    const normalizedStatus = item.status.trim() ? item.status : "unknown";
    const viewHref = buildReportDetailPath(item.reportId);
    const canView = viewHref !== null;
    const rowId =
      item.reportId ??
      `report-missing-id-${index}-${item.uploadId ?? item.jobId ?? item.createdAt ?? item.finishedAt ?? item.artifactUrl ?? "row"}`;

    return {
      id: rowId,
      reportId: item.reportId,
      title: item.title ?? "Report",
      status: normalizedStatus,
      statusLabel: toReportStatusLabel(normalizedStatus),
      statusVariant: toReportStatusVariant(normalizedStatus),
      createdAtLabel: formatReportCreatedAt(item.createdAt),
      viewHref,
      canView,
      canDownload: canView && normalizedStatus.toLowerCase() === "ready" && Boolean(item.artifactUrl),
      artifactUrl: item.artifactUrl,
    };
  });
}
