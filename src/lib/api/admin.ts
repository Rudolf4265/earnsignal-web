import { ApiError, apiFetchJson } from "./client";
import { isSessionExpiredError } from "../auth/isSessionExpiredError";
import type {
  AdminLatestReportResponseSchema,
  AdminLatestUploadResponseSchema,
  AdminUserRowSchema,
  AdminUsersListResponseSchema,
  AdminWhoAmIResponseSchema,
} from "./generated";

export type AdminWhoAmIResponse = {
  isAdmin: boolean;
  email: AdminWhoAmIResponseSchema["email"] | null;
};

export type AdminListMode = "recent" | "search";
export type AdminEmailState = "present" | "missing";

export type AdminUserRow = {
  creatorId: string;
  email: string | null;
  emailState: AdminEmailState;
  plan: string | null;
  planTier: string | null;
  status: string | null;
  entitlementSource: string | null;
  blocked: boolean;
  compUntil: string | null;
  uploadState: string | null;
  uploadAt: string | null;
  reportState: string | null;
  reportAt: string | null;
  createdAt: string | null;
  lastUpdatedAt: string | null;
};

export type AdminUserListResponse = {
  users: AdminUserRow[];
  total: number;
  mode: AdminListMode;
};

export type AdminUserDetail = AdminUserRow & {
  accessGranted: boolean;
  accessReasonCode: string | null;
  billingRequired: boolean;
  latestUpload: {
    id: string | null;
    status: string | null;
    createdAt: string | null;
    readyAt: string | null;
    failedReason: string | null;
    link: string | null;
  } | null;
  latestReport: {
    id: string | null;
    status: string | null;
    createdAt: string | null;
    finishedAt: string | null;
    failureCode: string | null;
    link: string | null;
  } | null;
  fetchedAtIso: string;
};

export type GrantAccessByEmailInput = {
  email: string;
  planTier: "A" | "B";
  endsAtIso?: string | null;
  reasonCode?: string | null;
  note?: string | null;
};

type RawAdminUpload = {
  id?: string | null;
  upload_id?: string | null;
  uploadId?: string | null;
  status?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  ready_at?: string | null;
  readyAt?: string | null;
  failed_reason?: string | null;
  failedReason?: string | null;
  link?: string | null;
  url?: string | null;
};

type RawAdminReport = {
  id?: string | null;
  report_id?: string | null;
  reportId?: string | null;
  status?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  finished_at?: string | null;
  finishedAt?: string | null;
  failure_code?: string | null;
  failureCode?: string | null;
  link?: string | null;
  url?: string | null;
};

type RawAdminUserRow = AdminUserRowSchema & {
  creator_id?: string;
  creatorId?: string;
  user_id?: string;
  userId?: string;
  email?: string | null;
  email_state?: string | null;
  emailState?: string | null;
  effective_plan_tier?: string | null;
  effectivePlanTier?: string | null;
  plan?: string | null;
  plan_tier?: string | null;
  planTier?: string | null;
  entitlement_status?: string | null;
  entitlementStatus?: string | null;
  status?: string | null;
  billing_status?: string | null;
  billingStatus?: string | null;
  entitlement_source?: string | null;
  entitlementSource?: string | null;
  blocked?: boolean;
  is_blocked?: boolean;
  isBlocked?: boolean;
  comp_until?: string | null;
  compUntil?: string | null;
  upload_state?: string | null;
  uploadState?: string | null;
  last_upload_status?: string | null;
  last_upload_at?: string | null;
  lastUploadAt?: string | null;
  report_state?: string | null;
  reportState?: string | null;
  last_report_status?: string | null;
  last_report_at?: string | null;
  lastReportAt?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  last_updated_at?: string | null;
  lastUpdatedAt?: string | null;
  latest_upload?: RawAdminUpload | null;
  latestUpload?: RawAdminUpload | null;
  latest_report?: RawAdminReport | null;
  latestReport?: RawAdminReport | null;
};

type RawAdminUserDetail = RawAdminUserRow & {
  access_granted?: boolean;
  accessGranted?: boolean;
  access_reason_code?: string | null;
  accessReasonCode?: string | null;
  billing_required?: boolean;
  billingRequired?: boolean;
};

type RawAdminUsersListResponse = AdminUsersListResponseSchema & {
  items?: RawAdminUserRow[];
  users?: RawAdminUserRow[];
  total?: number;
  mode?: string | null;
};

let whoAmICache: AdminWhoAmIResponse | null = null;
let inFlightWhoAmI: Promise<AdminWhoAmIResponse> | null = null;

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function normalizeEmailState(value: unknown, email: string | null): AdminEmailState {
  const normalized = asNullableString(value)?.toLowerCase();
  if (normalized === "present" || normalized === "missing") {
    return normalized;
  }
  return email ? "present" : "missing";
}

function mapUserRow(raw: RawAdminUserRow): AdminUserRow {
  const latestUpload = asObject(raw.latest_upload) ?? asObject(raw.latestUpload);
  const latestReport = asObject(raw.latest_report) ?? asObject(raw.latestReport);
  const email = asNullableString(raw.email);

  const creatorId =
    asNullableString(raw.creator_id) ??
    asNullableString(raw.creatorId) ??
    asNullableString(raw.user_id) ??
    asNullableString(raw.userId) ??
    "";

  const effectivePlan =
    asNullableString(raw.effective_plan_tier) ??
    asNullableString(raw.effectivePlanTier) ??
    asNullableString(raw.plan);
  const planTier = asNullableString(raw.plan_tier) ?? asNullableString(raw.planTier);

  return {
    creatorId,
    email,
    emailState: normalizeEmailState(raw.email_state ?? raw.emailState, email),
    plan: effectivePlan ?? planTier,
    planTier,
    status:
      asNullableString(raw.entitlement_status) ??
      asNullableString(raw.entitlementStatus) ??
      asNullableString(raw.status) ??
      asNullableString(raw.billing_status) ??
      asNullableString(raw.billingStatus),
    entitlementSource: asNullableString(raw.entitlement_source) ?? asNullableString(raw.entitlementSource),
    blocked: asBoolean(raw.blocked) || asBoolean(raw.is_blocked) || asBoolean(raw.isBlocked),
    compUntil: asNullableString(raw.comp_until) ?? asNullableString(raw.compUntil),
    uploadState:
      asNullableString(raw.last_upload_status) ??
      asNullableString(raw.upload_state) ??
      asNullableString(raw.uploadState) ??
      asNullableString(latestUpload?.status),
    uploadAt:
      asNullableString(raw.last_upload_at) ??
      asNullableString(raw.lastUploadAt) ??
      asNullableString(latestUpload?.created_at) ??
      asNullableString(latestUpload?.createdAt),
    reportState:
      asNullableString(raw.last_report_status) ??
      asNullableString(raw.report_state) ??
      asNullableString(raw.reportState) ??
      asNullableString(latestReport?.status),
    reportAt:
      asNullableString(raw.last_report_at) ??
      asNullableString(raw.lastReportAt) ??
      asNullableString(latestReport?.created_at) ??
      asNullableString(latestReport?.createdAt),
    createdAt: asNullableString(raw.created_at) ?? asNullableString(raw.createdAt),
    lastUpdatedAt: asNullableString(raw.last_updated_at) ?? asNullableString(raw.lastUpdatedAt),
  };
}

function normalizeUploadDetail(raw: unknown): AdminUserDetail["latestUpload"] {
  const value = asObject(raw);
  if (!value) {
    return null;
  }

  return {
    id: asNullableString(value.upload_id) ?? asNullableString(value.uploadId) ?? asNullableString(value.id),
    status: asNullableString(value.status),
    createdAt: asNullableString(value.created_at) ?? asNullableString(value.createdAt),
    readyAt: asNullableString(value.ready_at) ?? asNullableString(value.readyAt),
    failedReason: asNullableString(value.failed_reason) ?? asNullableString(value.failedReason),
    link: asNullableString(value.link) ?? asNullableString(value.url),
  };
}

function normalizeReportDetail(raw: unknown): AdminUserDetail["latestReport"] {
  const value = asObject(raw);
  if (!value) {
    return null;
  }

  return {
    id: asNullableString(value.report_id) ?? asNullableString(value.reportId) ?? asNullableString(value.id),
    status: asNullableString(value.status),
    createdAt: asNullableString(value.created_at) ?? asNullableString(value.createdAt),
    finishedAt: asNullableString(value.finished_at) ?? asNullableString(value.finishedAt),
    failureCode: asNullableString(value.failure_code) ?? asNullableString(value.failureCode),
    link: asNullableString(value.link) ?? asNullableString(value.url),
  };
}

function mapUserDetail(raw: RawAdminUserDetail): AdminUserDetail {
  const base = mapUserRow(raw);
  return {
    ...base,
    accessGranted: asBoolean(raw.access_granted) || asBoolean(raw.accessGranted),
    accessReasonCode: asNullableString(raw.access_reason_code) ?? asNullableString(raw.accessReasonCode),
    billingRequired: asBoolean(raw.billing_required) || asBoolean(raw.billingRequired),
    latestUpload: normalizeUploadDetail(raw.latest_upload ?? raw.latestUpload),
    latestReport: normalizeReportDetail(raw.latest_report ?? raw.latestReport),
    fetchedAtIso: new Date().toISOString(),
  };
}

function normalizeSearchMode(value: unknown, searchProvided: boolean): AdminListMode {
  const mode = asNullableString(value)?.toLowerCase();
  if (mode === "recent" || mode === "search") {
    return mode;
  }
  return searchProvided ? "search" : "recent";
}

export async function fetchAdminWhoAmI(options?: { forceRefresh?: boolean }): Promise<AdminWhoAmIResponse> {
  const forceRefresh = options?.forceRefresh ?? false;

  if (!forceRefresh && whoAmICache) {
    return whoAmICache;
  }

  if (!forceRefresh && inFlightWhoAmI) {
    return inFlightWhoAmI;
  }

  inFlightWhoAmI = (async () => {
    try {
      const payload = await apiFetchJson<AdminWhoAmIResponseSchema | Record<string, unknown>>("admin.whoami", "/v1/admin/whoami", {
        method: "GET",
      });
      const value = {
        isAdmin: asBoolean(payload.is_admin) || asBoolean(payload.admin) || asBoolean(payload.isAdmin),
        email: asNullableString(payload.email),
      };

      whoAmICache = value;
      return value;
    } catch (error) {
      if (error instanceof ApiError && isSessionExpiredError(error, { hasAuthContext: true })) {
        return { isAdmin: false, email: null };
      }

      throw error;
    }
  })();

  try {
    return await inFlightWhoAmI;
  } finally {
    inFlightWhoAmI = null;
  }
}

export async function fetchAdminUsers(search?: string): Promise<AdminUserListResponse> {
  const normalizedSearch = (search ?? "").trim();
  const query = normalizedSearch ? `?query=${encodeURIComponent(normalizedSearch)}` : "";
  const payload = await apiFetchJson<RawAdminUsersListResponse | Record<string, unknown>>("admin.users.list", `/v1/admin/users${query}`, {
    method: "GET",
  });
  const rowsRaw = ((payload.items as RawAdminUserRow[] | undefined) ?? (payload.users as RawAdminUserRow[] | undefined) ?? []);
  const users = rowsRaw.map(mapUserRow).filter((user) => Boolean(user.creatorId));
  const mode = normalizeSearchMode(payload.mode, Boolean(normalizedSearch));

  return {
    users,
    total: Number.isFinite(payload.total) ? Number(payload.total) : users.length,
    mode,
  };
}

export async function fetchAdminUserDetail(creatorId: string): Promise<AdminUserDetail> {
  const payload = await apiFetchJson<RawAdminUserDetail | Record<string, unknown>>(
    "admin.users.detail",
    `/v1/admin/users/${encodeURIComponent(creatorId)}/entitlement`,
    { method: "GET" },
  );
  const mapped = mapUserDetail(payload as RawAdminUserDetail);
  return mapped.creatorId ? mapped : { ...mapped, creatorId };
}

export async function grantAdminAccessByEmail(input: GrantAccessByEmailInput): Promise<AdminUserDetail> {
  const normalizedEmail = input.email.trim();
  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }

  const body: Record<string, unknown> = {
    email: normalizedEmail,
    plan_tier: input.planTier,
  };

  if (input.endsAtIso) {
    body.ends_at = input.endsAtIso;
  }

  if (input.note && input.note.trim().length > 0) {
    body.note = input.note.trim();
  }

  if (input.reasonCode && input.reasonCode.trim().length > 0) {
    body.reason_code = input.reasonCode.trim();
  }

  const payload = await apiFetchJson<RawAdminUserDetail | Record<string, unknown>>("admin.users.grantByEmail", "/v1/admin/users/grant-access-by-email", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return mapUserDetail(payload as RawAdminUserDetail);
}

export async function fetchAdminLatestUpload(creatorId: string): Promise<AdminUserDetail["latestUpload"]> {
  const payload = await apiFetchJson<AdminLatestUploadResponseSchema | Record<string, unknown>>(
    "admin.users.latestUpload",
    `/v1/admin/users/${encodeURIComponent(creatorId)}/uploads/latest`,
    { method: "GET" },
  );
  return normalizeUploadDetail(payload.latest_upload ?? payload.upload ?? payload.last_upload);
}

export async function fetchAdminLatestReport(creatorId: string): Promise<AdminUserDetail["latestReport"]> {
  const payload = await apiFetchJson<AdminLatestReportResponseSchema | Record<string, unknown>>(
    "admin.users.latestReport",
    `/v1/admin/users/${encodeURIComponent(creatorId)}/reports/latest`,
    { method: "GET" },
  );
  return normalizeReportDetail(payload.latest_report ?? payload.report ?? payload.last_report);
}

export async function updateAdminUserBlocked(creatorId: string, blocked: boolean): Promise<AdminUserRow> {
  const payload = await apiFetchJson<RawAdminUserRow | Record<string, unknown>>(
    "admin.users.updateBlocked",
    `/v1/admin/users/${encodeURIComponent(creatorId)}/block`,
    {
      method: "POST",
      body: JSON.stringify({ blocked }),
    },
  );

  return mapUserRow(payload as RawAdminUserRow);
}

export async function updateAdminUserCompUntil(creatorId: string, compUntil: string | null): Promise<AdminUserRow> {
  const payload = await apiFetchJson<RawAdminUserRow | Record<string, unknown>>(
    "admin.users.updateCompUntil",
    `/v1/admin/users/${encodeURIComponent(creatorId)}/comp`,
    {
      method: "POST",
      body: JSON.stringify({ comp_until: compUntil }),
    },
  );

  return mapUserRow(payload as RawAdminUserRow);
}
