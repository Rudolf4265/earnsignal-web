import { normalizeReportId } from "./id";
import { buildReportDetailPath } from "./path";
import { hasUsableReportArtifact } from "./artifact-availability";
import {
  canViewOwnedReportFromEntitlement,
  canViewReportHistoryFromEntitlement,
  hasProEquivalentEntitlement,
  isFounderFromEntitlement,
  type EntitlementSnapshotLike,
} from "../entitlements/model";
import {
  buildCanonicalReportTitle,
  formatIncludedSourceCountLabel,
  formatPlatformsSummaryLabel,
  normalizePlatformsIncluded,
  resolveReportKind,
  resolveReportSourceCount,
  type ReportKind,
} from "./source-labeling";

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
  title: string;
  platformsIncluded: string[];
  sourceCount: number | null;
  reportKind: ReportKind;
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
  platformsIncluded: string[];
  sourceCount: number | null;
  sourceCountLabel: string | null;
  platformSummary: string | null;
  analysisWindowLabel: string | null;
  reportKind: ReportKind;
};

export type ReportListExperienceKind = "free" | "purchased_reports" | "report_history";

export type ReportListExperienceModel = {
  kind: ReportListExperienceKind;
  sectionTitle: string;
  sectionDescription: string;
  continuityBody: string | null;
  upgradePrompt: string | null;
  primaryActionLabel: string;
  showSourceSummary: boolean;
};

const IN_FLIGHT_REPORT_STATUSES = new Set(["queued", "running", "processing"]);
const reportWindowFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

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

function readPositiveCount(value: unknown): number | null {
  const numeric = readNumber(value);
  return numeric !== null && numeric > 0 ? numeric : null;
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
  const createdAt = readString(record.created_at) ?? readString(record.createdAt);
  const coverageStart = readString(record.coverage_start) ?? readString(record.coverageStart);
  const coverageEnd = readString(record.coverage_end) ?? readString(record.coverageEnd);
  const platformsIncluded = normalizePlatformsIncluded(
    readStringArray(record.platforms_included) ??
      readStringArray(record.platformsIncluded) ??
      readStringArray(record.platforms),
  );
  const sourceCount = resolveReportSourceCount({
    platformsIncluded,
    sourceCount: readPositiveCount(record.source_count) ?? readPositiveCount(record.sourceCount),
  });
  const title = buildCanonicalReportTitle({
    createdAt,
    coverageEnd,
    coverageStart,
    platformsIncluded,
    sourceCount,
  });

  return {
    reportId,
    status: readString(record.status) ?? "unknown",
    createdAt,
    finishedAt: readString(record.finished_at) ?? readString(record.finishedAt),
    artifactUrl: readString(record.artifact_url) ?? readString(record.artifactUrl),
    artifactJsonUrl: readString(record.artifact_json_url) ?? readString(record.artifactJsonUrl),
    uploadId: readString(record.upload_id) ?? readString(record.uploadId),
    jobId: readString(record.job_id) ?? readString(record.jobId),
    schemaVersion: readString(record.schema_version) ?? readString(record.schemaVersion),
    title,
    platformsIncluded,
    sourceCount,
    reportKind: resolveReportKind({ platformsIncluded, sourceCount }),
    coverageStart,
    coverageEnd,
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

function formatReportWindowMonth(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return reportWindowFormatter.format(date);
}

export function formatReportAnalysisWindow(
  coverageStart: string | null | undefined,
  coverageEnd: string | null | undefined,
  createdAt?: string | null | undefined,
): string | null {
  const start = formatReportWindowMonth(coverageStart);
  const end = formatReportWindowMonth(coverageEnd);
  const fallback = formatReportWindowMonth(createdAt);

  if (start && end) {
    return start === end ? start : `${start} - ${end}`;
  }

  return end ?? start ?? fallback;
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

export function isInFlightReportStatus(status: string): boolean {
  return IN_FLIGHT_REPORT_STATUSES.has(status.trim().toLowerCase());
}

export function overlayReportRunStatus(
  item: ReportListItem,
  status: {
    status: string;
    createdAt: string | null;
    finishedAt: string | null;
    schemaVersion: string | null;
  },
): ReportListItem {
  const nextStatus = status.status.trim() || item.status;

  return {
    ...item,
    status: nextStatus,
    createdAt: item.createdAt ?? status.createdAt,
    finishedAt: status.finishedAt ?? item.finishedAt,
    schemaVersion: item.schemaVersion ?? status.schemaVersion,
  };
}

export function toReportListRows(items: ReportListItem[]): ReportListRow[] {
  return items.map((item, index) => {
    const normalizedStatus = item.status.trim() ? item.status : "unknown";
    const viewHref = buildReportDetailPath(item.reportId);
    const canView = viewHref !== null;
    const canDownload = hasUsableReportArtifact({
      reportId: item.reportId,
      status: normalizedStatus,
      artifactUrl: item.artifactUrl,
    });
    const rowId =
      item.reportId ??
      `report-missing-id-${index}-${item.uploadId ?? item.jobId ?? item.createdAt ?? item.finishedAt ?? item.artifactUrl ?? "row"}`;

    return {
      id: rowId,
      reportId: item.reportId,
      title: item.title,
      status: normalizedStatus,
      statusLabel: toReportStatusLabel(normalizedStatus),
      statusVariant: toReportStatusVariant(normalizedStatus),
      createdAtLabel: formatReportCreatedAt(item.createdAt),
      viewHref,
      canView,
      canDownload: canView && canDownload,
      artifactUrl: item.artifactUrl,
      platformsIncluded: item.platformsIncluded,
      sourceCount: item.sourceCount,
      sourceCountLabel: formatIncludedSourceCountLabel(item.sourceCount),
      platformSummary: formatPlatformsSummaryLabel(item.platformsIncluded),
      analysisWindowLabel: formatReportAnalysisWindow(item.coverageStart, item.coverageEnd, item.createdAt),
      reportKind: item.reportKind,
    };
  });
}

function formatReportListSectionDescription(kind: ReportListExperienceKind, count: number): string {
  if (kind === "purchased_reports") {
    if (count === 0) {
      return "No purchased reports to display yet.";
    }

    if (count === 1) {
      return "Showing 1 purchased report.";
    }

    return `Showing ${count} purchased reports.`;
  }

  if (kind === "report_history") {
    if (count === 0) {
      return "No report history to display yet.";
    }

    if (count === 1) {
      return "Showing 1 report in history.";
    }

    return `Showing ${count} reports in history.`;
  }

  if (count === 0) {
    return "No reports to display yet.";
  }

  if (count === 1) {
    return "Showing 1 recent report.";
  }

  return `Showing ${count} recent reports.`;
}

export function buildReportListExperienceModel(input: {
  entitlements: EntitlementSnapshotLike | null | undefined;
  reportCount: number;
}): ReportListExperienceModel {
  const isHistoryExperience =
    isFounderFromEntitlement(input.entitlements) ||
    canViewReportHistoryFromEntitlement(input.entitlements) ||
    hasProEquivalentEntitlement(input.entitlements);

  if (isHistoryExperience) {
    return {
      kind: "report_history",
      sectionTitle: "Report History",
      sectionDescription: formatReportListSectionDescription("report_history", input.reportCount),
      continuityBody: "Connected history across eligible reports and fresh Pro runs, with room for comparisons and ongoing intelligence.",
      upgradePrompt: null,
      primaryActionLabel: "Open Report",
      showSourceSummary: true,
    };
  }

  if (canViewOwnedReportFromEntitlement(input.entitlements)) {
    return {
      kind: "purchased_reports",
      sectionTitle: "Purchased Reports",
      sectionDescription: formatReportListSectionDescription("purchased_reports", input.reportCount),
      continuityBody: null,
      upgradePrompt: "You own these reports. Pro connects them with history, comparisons, and ongoing intelligence.",
      primaryActionLabel: "Open Report",
      showSourceSummary: false,
    };
  }

  return {
    kind: "free",
    sectionTitle: "Recent Reports",
    sectionDescription: formatReportListSectionDescription("free", input.reportCount),
    continuityBody: null,
    upgradePrompt: null,
    primaryActionLabel: "Open Report",
    showSourceSummary: true,
  };
}
