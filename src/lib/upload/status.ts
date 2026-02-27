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

export type UploadUiStatus = "processing" | "ready" | "failed";

export type UploadFailureReason = "session_expired" | "upload_not_found" | "timeout" | "upload_failed" | string;

export type UploadStatusEnvelope = {
  upload_id?: string;
  uploadId?: string;
  status?: UploadBackendStatus;
  reason_code?: string;
  reasonCode?: string;
  message?: string;
  report_id?: string;
  reportId?: string;
  updated_at?: string;
  updatedAt?: string;
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
const FAILED = new Set(["failed", "error", "rejected", "validation_failed", "ingest_failed", "report_failed"]);

export function mapUploadStatus(input: UploadStatusEnvelope): UploadStatusView {
  const rawStatus = typeof input.status === "string" ? input.status.toLowerCase() : null;
  const status: UploadUiStatus = rawStatus && READY.has(rawStatus) ? "ready" : rawStatus && FAILED.has(rawStatus) ? "failed" : "processing";

  return {
    uploadId: input.upload_id ?? input.uploadId ?? null,
    status,
    reasonCode: input.reason_code ?? input.reasonCode ?? null,
    message: input.message ?? null,
    reportId: input.report_id ?? input.reportId ?? null,
    rawStatus,
    updatedAt: input.updated_at ?? input.updatedAt ?? null,
  };
}

export function isTerminalUploadStatus(status: UploadUiStatus): boolean {
  return status === "ready" || status === "failed";
}

export function buildUploadDiagnostics(params: {
  uploadId: string | null;
  rawStatus: string | null;
  reasonCode: string | null;
  message: string | null;
  updatedAt?: string | null;
}): string {
  return JSON.stringify(
    {
      upload_id: params.uploadId ?? null,
      status: params.rawStatus ?? "unknown",
      reason_code: params.reasonCode ?? null,
      message: params.message ?? null,
      updated_at: params.updatedAt ?? null,
    },
    null,
    2,
  );
}
