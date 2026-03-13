import { normalizeReportId } from "../report/id";

export type UploadBackendStatus =
  | "pending"
  | "uploaded"
  | "upload_received"
  | "queued"
  | "processing"
  | "validating"
  | "validated"
  | "ingesting"
  | "ingested"
  | "generating_report"
  | "report_generating"
  | "report_ready"
  | "ready"
  | "completed"
  | "complete"
  | "succeeded"
  | "success"
  | "failed"
  | "error"
  | "rejected"
  | "validation_failed"
  | "ingest_failed"
  | "report_failed"
  | string;

export type UploadUiStatus = "processing" | "validated" | "ready" | "failed";

export type UploadFailureReason = "session_expired" | "upload_not_found" | "timeout" | "upload_failed" | string;

type NullableBackendString = string | null | undefined;

export type UploadStatusEnvelope = {
  upload_id?: string;
  uploadId?: string;
  status?: UploadBackendStatus;
  reason_code?: NullableBackendString;
  reasonCode?: NullableBackendString;
  reason?: NullableBackendString;
  message?: NullableBackendString;
  report_id?: NullableBackendString;
  reportId?: NullableBackendString;
  updated_at?: NullableBackendString;
  updatedAt?: NullableBackendString;
};

export type UploadStatusView = {
  uploadId: string | null;
  status: UploadUiStatus;
  reasonCode: string | null;
  message: string | null;
  reportId: string | null;
  rawStatus: string | null;
  updatedAt: string | null;
};

const READY = new Set(["ready", "report_ready", "completed", "complete", "succeeded", "success"]);
const VALIDATED = new Set(["validated", "ingestion_succeeded"]);
const FAILED = new Set(["failed", "error", "rejected", "validation_failed", "ingest_failed", "report_failed"]);

function normalizeNullableString(value: NullableBackendString): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function mapUploadStatus(input: UploadStatusEnvelope): UploadStatusView {
  const rawStatus = normalizeNullableString(input.status)?.toLowerCase() ?? null;
  const status: UploadUiStatus = rawStatus && READY.has(rawStatus) ? "ready" : rawStatus && VALIDATED.has(rawStatus) ? "validated" : rawStatus && FAILED.has(rawStatus) ? "failed" : "processing";
  const reasonCode = normalizeNullableString(input.reason_code) ?? normalizeNullableString(input.reasonCode);
  const message = normalizeNullableString(input.message);
  const reportId = normalizeNullableString(input.report_id) ?? normalizeNullableString(input.reportId);
  const updatedAt = normalizeNullableString(input.updated_at) ?? normalizeNullableString(input.updatedAt);

  return {
    uploadId: input.upload_id ?? input.uploadId ?? null,
    status,
    reasonCode: reasonCode ?? null,
    message: message ?? null,
    reportId: normalizeReportId(reportId),
    rawStatus,
    updatedAt: updatedAt ?? null,
  };
}

export function isTerminalUploadStatus(status: UploadUiStatus): boolean {
  return status === "validated" || status === "ready" || status === "failed";
}

export function buildUploadDiagnostics(params: {
  uploadId: string | null;
  rawStatus: string | null;
  reasonCode: string | null;
  message: string | null;
  updatedAt?: string | null;
  requestId?: string | null;
  operation?: string | null;
}): string {
  return JSON.stringify(
    {
      upload_id: params.uploadId ?? null,
      status: params.rawStatus ?? "unknown",
      reason_code: params.reasonCode ?? null,
      message: params.message ?? null,
      updated_at: params.updatedAt ?? null,
      request_id: params.requestId ?? null,
      operation: params.operation ?? null,
    },
    null,
    2,
  );
}
