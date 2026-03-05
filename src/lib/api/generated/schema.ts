/* eslint-disable */
/**
 * This is a checked-in snapshot of backend OpenAPI types.
 * Refresh with: npm run api:generate
 */

export interface components {
  schemas: {
    CheckoutCreateRequest: {
      plan: "plan_a" | "plan_b";
    };
    CheckoutSessionResponse: {
      checkout_url: string;
      checkoutUrl?: string;
      url?: string;
    };
    EntitlementsFeatures: {
      [key: string]: boolean;
    };
    EntitlementsResponse: {
      plan?: string | null;
      plan_tier?: string | null;
      status?: string | null;
      entitled?: boolean;
      is_active?: boolean;
      features?: components["schemas"]["EntitlementsFeatures"];
      portal_url?: string | null;
      portalUrl?: string | null;
    };
    UploadPresignRequest: {
      platform: string;
      filename: string;
      content_type: string;
      size: number;
      checksum?: string;
      sha256?: string;
      content_md5?: string;
    };
    UploadPresignResponse: {
      upload_id?: string;
      uploadId?: string;
      object_key?: string;
      objectKey?: string;
      presigned_url?: string;
      presign_url?: string;
      url?: string;
      callback_url?: string;
      callbackUrl?: string;
      callback_proof?: Record<string, unknown> | string;
      callbackProof?: Record<string, unknown> | string;
      headers?: Record<string, string>;
      required_headers?: Record<string, string>;
    };
    UploadCallbackRequest: {
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
    };
    UploadCallbackResponse: {
      upload_id?: string;
      uploadId?: string;
      status?: string;
      warnings?: string[];
    };
    ReportGenerateRequest: {
      upload_id: string;
      platform: string;
      upload_ids?: string[];
    };
    ReportGenerateResponse: {
      report_id?: string;
      reportId?: string;
      warnings?: string[];
    };
    UploadStatusResponse: {
      upload_id?: string;
      uploadId?: string;
      status?: string;
      reason_code?: string;
      reasonCode?: string;
      message?: string;
      report_id?: string;
      reportId?: string;
      updated_at?: string;
      updatedAt?: string;
    };
    ReportDetailResponse: {
      [key: string]: unknown;
    };
    AdminWhoAmIResponse: {
      is_admin?: boolean;
      admin?: boolean;
      isAdmin?: boolean;
      email?: string | null;
    };
    AdminUserRow: {
      creator_id?: string;
      creatorId?: string;
      email?: string | null;
      plan?: string | null;
      plan_tier?: string | null;
      planTier?: string | null;
      status?: string | null;
      billing_status?: string | null;
      billingStatus?: string | null;
      blocked?: boolean;
      is_blocked?: boolean;
      isBlocked?: boolean;
      comp_until?: string | null;
      compUntil?: string | null;
      upload_state?: string | null;
      last_upload_status?: string | null;
      uploadState?: string | null;
    };
    AdminUsersListResponse: {
      items?: components["schemas"]["AdminUserRow"][];
      users?: components["schemas"]["AdminUserRow"][];
      total?: number;
    };
    AdminHealthItem: {
      id?: string | null;
      status?: string | null;
      created_at?: string | null;
      createdAt?: string | null;
      link?: string | null;
      url?: string | null;
    };
    AdminLatestUploadResponse: {
      latest_upload?: components["schemas"]["AdminHealthItem"];
      upload?: components["schemas"]["AdminHealthItem"];
      last_upload?: components["schemas"]["AdminHealthItem"];
    };
    AdminLatestReportResponse: {
      latest_report?: components["schemas"]["AdminHealthItem"];
      report?: components["schemas"]["AdminHealthItem"];
      last_report?: components["schemas"]["AdminHealthItem"];
    };
  };
}

export interface paths {}
export interface operations {}
