import { apiFetchJson } from "./client";
import type { UploadPlatform } from "./upload";

export type WorkspaceDataSourceState = "missing" | "processing" | "ready" | "failed";
export type WorkspaceDataSourceActionLabel = "Upload" | "Replace" | "Retry" | "View status";

type NullableString = string | null | undefined;

type RawWorkspaceDataSource = {
  platform?: UploadPlatform;
  label?: NullableString;
  descriptor?: NullableString;
  accepted_file_types_label?: NullableString;
  acceptedFileTypesLabel?: NullableString;
  report_role?: NullableString;
  reportRole?: NullableString;
  standalone_report_eligible?: boolean | null;
  standaloneReportEligible?: boolean | null;
  business_metrics_capable?: boolean | null;
  businessMetricsCapable?: boolean | null;
  role_summary?: NullableString;
  roleSummary?: NullableString;
  state?: WorkspaceDataSourceState | string;
  included_in_next_report?: boolean | null;
  includedInNextReport?: boolean | null;
  last_upload_at?: NullableString;
  lastUploadAt?: NullableString;
  last_ready_at?: NullableString;
  lastReadyAt?: NullableString;
  status_message?: NullableString;
  statusMessage?: NullableString;
  action_label?: WorkspaceDataSourceActionLabel | string;
  actionLabel?: WorkspaceDataSourceActionLabel | string;
};

type RawWorkspaceDataSourcesResponse = {
  workspace_id?: NullableString;
  workspaceId?: NullableString;
  supported_source_count?: number | null;
  supportedSourceCount?: number | null;
  ready_source_count?: number | null;
  readySourceCount?: number | null;
  processing_source_count?: number | null;
  processingSourceCount?: number | null;
  missing_source_count?: number | null;
  missingSourceCount?: number | null;
  failed_source_count?: number | null;
  failedSourceCount?: number | null;
  included_source_count?: number | null;
  includedSourceCount?: number | null;
  run_report_enabled?: boolean | null;
  runReportEnabled?: boolean | null;
  report_driving_ready_source_count?: number | null;
  reportDrivingReadySourceCount?: number | null;
  report_driving_included_source_count?: number | null;
  reportDrivingIncludedSourceCount?: number | null;
  eligible_for_report?: boolean | null;
  eligibleForReport?: boolean | null;
  blocking_reason?: NullableString;
  blockingReason?: NullableString;
  report_has_business_metrics?: boolean | null;
  reportHasBusinessMetrics?: boolean | null;
  report_readiness_note?: NullableString;
  reportReadinessNote?: NullableString;
  sources?: RawWorkspaceDataSource[] | null;
};

export type WorkspaceSourceReportRole = "report_driving" | "supporting";

export type WorkspaceDataSource = {
  platform: UploadPlatform;
  label: string;
  descriptor: string;
  acceptedFileTypesLabel: string;
  reportRole: WorkspaceSourceReportRole;
  standaloneReportEligible: boolean;
  businessMetricsCapable: boolean;
  roleSummary: string;
  state: WorkspaceDataSourceState;
  includedInNextReport: boolean;
  lastUploadAt: string | null;
  lastReadyAt: string | null;
  statusMessage: string | null;
  actionLabel: WorkspaceDataSourceActionLabel;
};

export type WorkspaceDataSourcesResponse = {
  workspaceId: string | null;
  supportedSourceCount: number;
  readySourceCount: number;
  processingSourceCount: number;
  missingSourceCount: number;
  failedSourceCount: number;
  includedSourceCount: number;
  runReportEnabled: boolean;
  eligibleForReport: boolean;
  blockingReason: string | null;
  reportHasBusinessMetrics: boolean;
  reportReadinessNote: string | null;
  reportDrivingReadySourceCount: number | null;
  reportDrivingIncludedSourceCount: number | null;
  sources: WorkspaceDataSource[];
};

const WORKSPACE_DATA_SOURCE_STATES = new Set<WorkspaceDataSourceState>(["missing", "processing", "ready", "failed"]);
const WORKSPACE_ACTION_LABELS = new Set<WorkspaceDataSourceActionLabel>(["Upload", "Replace", "Retry", "View status"]);

function normalizeNullableString(value: NullableString): string | null {
  return typeof value === "string" ? value : null;
}

function normalizeCount(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

function normalizeOptionalCount(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : null;
}

function normalizeWorkspaceDataSourceState(value: string | null | undefined): WorkspaceDataSourceState {
  return value && WORKSPACE_DATA_SOURCE_STATES.has(value as WorkspaceDataSourceState) ? (value as WorkspaceDataSourceState) : "missing";
}

function normalizeWorkspaceActionLabel(value: string | null | undefined): WorkspaceDataSourceActionLabel {
  return value && WORKSPACE_ACTION_LABELS.has(value as WorkspaceDataSourceActionLabel) ? (value as WorkspaceDataSourceActionLabel) : "Upload";
}

function normalizeWorkspaceSourceRole(value: string | null | undefined): WorkspaceSourceReportRole {
  return value === "report_driving" ? "report_driving" : "supporting";
}

function normalizeWorkspaceDataSource(raw: RawWorkspaceDataSource): WorkspaceDataSource | null {
  const platform = raw.platform;
  if (!platform) {
    return null;
  }

  return {
    platform,
    label: normalizeNullableString(raw.label) ?? platform,
    descriptor: normalizeNullableString(raw.descriptor) ?? "",
    acceptedFileTypesLabel:
      normalizeNullableString(raw.accepted_file_types_label) ??
      normalizeNullableString(raw.acceptedFileTypesLabel) ??
      "",
    reportRole: normalizeWorkspaceSourceRole(
      normalizeNullableString(raw.report_role) ?? normalizeNullableString(raw.reportRole),
    ),
    standaloneReportEligible:
      raw.standalone_report_eligible === true || raw.standaloneReportEligible === true,
    businessMetricsCapable:
      raw.business_metrics_capable === true || raw.businessMetricsCapable === true,
    roleSummary:
      normalizeNullableString(raw.role_summary) ??
      normalizeNullableString(raw.roleSummary) ??
      "",
    state: normalizeWorkspaceDataSourceState(normalizeNullableString(raw.state)),
    includedInNextReport: raw.included_in_next_report === true || raw.includedInNextReport === true,
    lastUploadAt: normalizeNullableString(raw.last_upload_at) ?? normalizeNullableString(raw.lastUploadAt),
    lastReadyAt: normalizeNullableString(raw.last_ready_at) ?? normalizeNullableString(raw.lastReadyAt),
    statusMessage: normalizeNullableString(raw.status_message) ?? normalizeNullableString(raw.statusMessage),
    actionLabel: normalizeWorkspaceActionLabel(
      normalizeNullableString(raw.action_label) ?? normalizeNullableString(raw.actionLabel),
    ),
  };
}

export function normalizeWorkspaceDataSourcesResponse(
  raw: RawWorkspaceDataSourcesResponse | null | undefined,
): WorkspaceDataSourcesResponse {
  const sources = Array.isArray(raw?.sources) ? raw.sources.map(normalizeWorkspaceDataSource).filter((source): source is WorkspaceDataSource => source !== null) : [];

  return {
    workspaceId: normalizeNullableString(raw?.workspace_id) ?? normalizeNullableString(raw?.workspaceId),
    supportedSourceCount: normalizeCount(raw?.supported_source_count ?? raw?.supportedSourceCount),
    readySourceCount: normalizeCount(raw?.ready_source_count ?? raw?.readySourceCount),
    processingSourceCount: normalizeCount(raw?.processing_source_count ?? raw?.processingSourceCount),
    missingSourceCount: normalizeCount(raw?.missing_source_count ?? raw?.missingSourceCount),
    failedSourceCount: normalizeCount(raw?.failed_source_count ?? raw?.failedSourceCount),
    includedSourceCount: normalizeCount(raw?.included_source_count ?? raw?.includedSourceCount),
    runReportEnabled: raw?.run_report_enabled === true || raw?.runReportEnabled === true,
    eligibleForReport:
      raw?.eligible_for_report === true ||
      raw?.eligibleForReport === true ||
      raw?.run_report_enabled === true ||
      raw?.runReportEnabled === true,
    blockingReason: normalizeNullableString(raw?.blocking_reason) ?? normalizeNullableString(raw?.blockingReason),
    reportHasBusinessMetrics:
      raw?.report_has_business_metrics === true || raw?.reportHasBusinessMetrics === true,
    reportReadinessNote:
      normalizeNullableString(raw?.report_readiness_note) ?? normalizeNullableString(raw?.reportReadinessNote),
    reportDrivingReadySourceCount: normalizeOptionalCount(
      raw?.report_driving_ready_source_count ?? raw?.reportDrivingReadySourceCount,
    ),
    reportDrivingIncludedSourceCount: normalizeOptionalCount(
      raw?.report_driving_included_source_count ?? raw?.reportDrivingIncludedSourceCount,
    ),
    sources,
  };
}

export async function fetchWorkspaceDataSources(): Promise<WorkspaceDataSourcesResponse> {
  const data = await apiFetchJson<RawWorkspaceDataSourcesResponse>("workspace.dataSources", "/v1/workspace/data-sources", {
    method: "GET",
  });

  return normalizeWorkspaceDataSourcesResponse(data);
}
