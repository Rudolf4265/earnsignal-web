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
  created_at?: string;
  createdAt?: string;
  validated_at?: string;
  validatedAt?: string;
  ingested_at?: string;
  ingestedAt?: string;
  report_started_at?: string;
  reportStartedAt?: string;
  ready_at?: string;
  readyAt?: string;
  reason_code?: string;
  reasonCode?: string;
  reason?: string;
  recommended_next_action?: string;
  recommendedNextAction?: string;
  rows_written?: number;
  rowsWritten?: number;
  months_present?: number;
  monthsPresent?: number;
  message?: string;
  report_id?: string;
  reportId?: string;
  updated_at?: string;
  updatedAt?: string;
};

export type UploadStatusTimestamps = {
  created_at: string | null;
  validated_at: string | null;
  ingested_at: string | null;
  report_started_at: string | null;
  ready_at: string | null;
  updated_at: string | null;
};

export type UploadStatusView = {
  uploadId: string | null;
  status: UploadUiStatus;
  reasonCode: string | null;
  reason: string | null;
  message: string | null;
  reportId: string | null;
  rawStatus: string | null;
  updatedAt: string | null;
  recommendedNextAction: string | null;
  monthsPresent: number | null;
  rowsWritten: number | null;
  timestamps: UploadStatusTimestamps;
};

const READY = new Set(["ready", "report_ready", "completed", "complete", "succeeded", "success"]);
const FAILED = new Set(["failed", "error", "rejected", "validation_failed", "ingest_failed", "report_failed"]);

export function mapUploadStatus(input: UploadStatusEnvelope): UploadStatusView {
  const rawStatus = typeof input.status === "string" ? input.status.toLowerCase() : null;
  const status: UploadUiStatus = rawStatus && READY.has(rawStatus) ? "ready" : rawStatus && FAILED.has(rawStatus) ? "failed" : "processing";
  const updatedAt = input.updated_at ?? input.updatedAt ?? null;

  return {
    uploadId: input.upload_id ?? input.uploadId ?? null,
    status,
    reasonCode: input.reason_code ?? input.reasonCode ?? null,
    reason: input.reason ?? null,
    message: input.message ?? null,
    reportId: input.report_id ?? input.reportId ?? null,
    rawStatus,
    updatedAt,
    recommendedNextAction: input.recommended_next_action ?? input.recommendedNextAction ?? null,
    monthsPresent: input.months_present ?? input.monthsPresent ?? null,
    rowsWritten: input.rows_written ?? input.rowsWritten ?? null,
    timestamps: {
      created_at: input.created_at ?? input.createdAt ?? null,
      validated_at: input.validated_at ?? input.validatedAt ?? null,
      ingested_at: input.ingested_at ?? input.ingestedAt ?? null,
      report_started_at: input.report_started_at ?? input.reportStartedAt ?? null,
      ready_at: input.ready_at ?? input.readyAt ?? null,
      updated_at: updatedAt,
    },
  };
}

const VALIDATING = new Set(["validating", "validated"]);
const PREPARING_REPORT = new Set(["ingesting", "ingested"]);
const GENERATING_REPORT = new Set(["reporting", "generating_report", "report_generating"]);

export function uploadStatusMessage(rawStatus: string | null): string {
  if (!rawStatus) {
    return "Processing upload…";
  }

  if (VALIDATING.has(rawStatus)) {
    return "Validating…";
  }

  if (PREPARING_REPORT.has(rawStatus)) {
    return "Preparing report…";
  }

  if (GENERATING_REPORT.has(rawStatus)) {
    return "Generating report…";
  }

  return "Processing upload…";
}

export function isTerminalUploadStatus(status: UploadUiStatus): boolean {
  return status === "ready" || status === "failed";
}

export function buildUploadDiagnostics(params: {
  uploadId: string | null;
  rawStatus: string | null;
  reason: string | null;
  timestamps: UploadStatusTimestamps;
  monthsPresent: number | null;
  rowsWritten: number | null;
  recommendedNextAction: string | null;
}): string {
  return JSON.stringify(
    {
      upload_id: params.uploadId ?? null,
      status: params.rawStatus ?? "unknown",
      timestamps: params.timestamps,
      reason: params.reason ?? null,
      months_present: params.monthsPresent ?? null,
      rows_written: params.rowsWritten ?? null,
      recommended_next_action: params.recommendedNextAction ?? null,
    },
    null,
    2,
  );
}
