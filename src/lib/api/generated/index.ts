import type { components as GeneratedComponents } from "./schema";

type Schemas = GeneratedComponents extends { schemas: infer T } ? T : unknown;
type SchemaOrFallback<Name extends string, Fallback> = Name extends keyof Schemas ? Schemas[Name] : Fallback;

export type CheckoutCreateRequestSchema = SchemaOrFallback<
  "CheckoutCreateRequest",
  {
    plan: "plan_a" | "plan_b";
  }
>;

export type CheckoutSessionResponseSchema = SchemaOrFallback<
  "CheckoutSessionResponse",
  {
    checkout_url: string;
    checkoutUrl?: string;
    url?: string;
  }
>;

export type EntitlementsResponseSchema = SchemaOrFallback<
  "EntitlementsResponse",
  {
    effective_plan_tier?: string | null;
    effectivePlanTier?: string | null;
    entitlement_source?: string | null;
    entitlementSource?: string | null;
    access_granted?: boolean;
    accessGranted?: boolean;
    access_reason_code?: string | null;
    accessReasonCode?: string | null;
    billing_required?: boolean;
    billingRequired?: boolean;
    plan?: string | null;
    plan_tier?: string | null;
    status?: string | null;
    entitled?: boolean;
    is_active?: boolean;
    features?: Record<string, boolean>;
    portal_url?: string | null;
    portalUrl?: string | null;
  }
>;

export type UploadPresignRequestSchema = SchemaOrFallback<
  "UploadPresignRequest",
  {
    platform: string;
    filename: string;
    content_type: string;
    size: number;
    checksum?: string;
    sha256?: string;
    content_md5?: string;
  }
>;

export type UploadPresignResponseSchema = SchemaOrFallback<
  "UploadPresignResponse",
  {
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
  }
>;

export type UploadCallbackRequestSchema = SchemaOrFallback<
  "UploadCallbackRequest",
  {
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
>;

export type UploadCallbackResponseSchema = SchemaOrFallback<
  "UploadCallbackResponse",
  {
    upload_id?: string;
    uploadId?: string;
    status?: string;
    warnings?: string[];
  }
>;

export type ReportGenerateRequestSchema = SchemaOrFallback<
  "ReportGenerateRequest",
  {
    upload_id: string;
    platform: string;
    upload_ids?: string[];
  }
>;

export type ReportGenerateResponseSchema = SchemaOrFallback<
  "ReportGenerateResponse",
  {
    report_id?: string;
    reportId?: string;
    warnings?: string[];
  }
>;

export type UploadStatusResponseSchema = SchemaOrFallback<
  "UploadStatusResponse",
  {
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
  }
>;

export type ReportDetailResponseSchema = SchemaOrFallback<"ReportDetailResponse", Record<string, unknown>>;

export type AdminWhoAmIResponseSchema = SchemaOrFallback<
  "AdminWhoAmIResponse",
  {
    is_admin?: boolean;
    admin?: boolean;
    isAdmin?: boolean;
    email?: string | null;
  }
>;

export type AdminUserRowSchema = SchemaOrFallback<
  "AdminUserRow",
  {
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
  }
>;

export type AdminUsersListResponseSchema = SchemaOrFallback<
  "AdminUsersListResponse",
  {
    items?: AdminUserRowSchema[];
    users?: AdminUserRowSchema[];
    total?: number;
  }
>;

export type AdminHealthItemSchema = SchemaOrFallback<
  "AdminHealthItem",
  {
    id?: string | null;
    status?: string | null;
    created_at?: string | null;
    createdAt?: string | null;
    link?: string | null;
    url?: string | null;
  }
>;

export type AdminLatestUploadResponseSchema = SchemaOrFallback<
  "AdminLatestUploadResponse",
  {
    latest_upload?: AdminHealthItemSchema;
    upload?: AdminHealthItemSchema;
    last_upload?: AdminHealthItemSchema;
  }
>;

export type AdminLatestReportResponseSchema = SchemaOrFallback<
  "AdminLatestReportResponse",
  {
    latest_report?: AdminHealthItemSchema;
    report?: AdminHealthItemSchema;
    last_report?: AdminHealthItemSchema;
  }
>;
