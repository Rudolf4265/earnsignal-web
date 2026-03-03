export interface UploadPresignRequestContract {
  platform: string;
  filename: string;
  content_type: string;
  size: number;
  checksum?: string;
  sha256?: string;
  content_md5?: string;
}

export interface UploadPresignResponseContract {
  upload_id: string;
  object_key?: string;
  presigned_url?: string;
  presign_url?: string;
  url?: string;
  callback_url?: string;
  callbackUrl?: string;
  callback_proof?: Record<string, unknown> | string;
  callbackProof?: Record<string, unknown> | string;
  headers?: Record<string, string>;
}

export interface UploadFinalizeCallbackRequestContract {
  upload_id: string;
  success: boolean;
  size_bytes: number;
  callback_proof: Record<string, unknown> | string;
  platform: string;
  object_key?: string;
  filename: string;
  content_type: string;
  sha256?: string;
  content_md5?: string;
}

export interface UploadFinalizeCallbackResponseContract {
  upload_id: string;
  status?: string;
  warnings?: string[];
}

export interface UploadStatusResponseContract {
  upload_id?: string;
  uploadId?: string;
  status?: string;
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
  reason?: string;
  reason_code?: string;
  reasonCode?: string;
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
}
