import { ApiError, apiFetchJson } from "../src/lib/api/client.ts";
import { isSessionExpiredError } from "../src/lib/auth/isSessionExpiredError.ts";

export type AdminWhoAmIResponse = {
  isAdmin: boolean;
  email: string | null;
};

export type AdminUserRow = {
  creatorId: string;
  email: string | null;
  plan: string | null;
  status: string | null;
  blocked: boolean;
  compUntil: string | null;
  uploadState: string | null;
};

export type AdminUserListResponse = {
  users: AdminUserRow[];
  total: number;
};

export type AdminUserDetail = AdminUserRow & {
  latestUpload: {
    id: string | null;
    status: string | null;
    createdAt: string | null;
    link: string | null;
  } | null;
  latestReport: {
    id: string | null;
    status: string | null;
    createdAt: string | null;
    link: string | null;
  } | null;
  fetchedAtIso: string;
};

let whoAmICache: AdminWhoAmIResponse | null = null;
let inFlightWhoAmI: Promise<AdminWhoAmIResponse> | null = null;

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function mapUserRow(raw: Record<string, unknown>): AdminUserRow {
  return {
    creatorId: asString(raw.creator_id) ?? asString(raw.creatorId) ?? "",
    email: asString(raw.email),
    plan: asString(raw.plan),
    status: asString(raw.status),
    blocked: asBoolean(raw.blocked),
    compUntil: asString(raw.comp_until) ?? asString(raw.compUntil),
    uploadState: asString(raw.upload_state) ?? asString(raw.last_upload_status) ?? asString(raw.uploadState),
  };
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
      const payload = await apiFetchJson<Record<string, unknown>>("admin.whoami", "/v1/admin/whoami", { method: "GET" });
      const value = {
        isAdmin: asBoolean(payload.is_admin) || asBoolean(payload.admin) || asBoolean(payload.isAdmin),
        email: asString(payload.email),
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
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const payload = await apiFetchJson<Record<string, unknown>>("admin.users.list", `/v1/admin/users${query}`, { method: "GET" });
  const rowsRaw = (payload.users as Record<string, unknown>[] | undefined) ?? [];
  const users = rowsRaw.map(mapUserRow).filter((user) => Boolean(user.creatorId));

  return {
    users,
    total: Number.isFinite(payload.total) ? Number(payload.total) : users.length,
  };
}

function normalizeHealth(raw: unknown): { id: string | null; status: string | null; createdAt: string | null; link: string | null } | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const value = raw as Record<string, unknown>;
  return {
    id: asString(value.id),
    status: asString(value.status),
    createdAt: asString(value.created_at) ?? asString(value.createdAt),
    link: asString(value.link) ?? asString(value.url),
  };
}

export async function fetchAdminUserDetail(creatorId: string): Promise<AdminUserDetail> {
  const payload = await apiFetchJson<Record<string, unknown>>(
    "admin.users.detail",
    `/v1/admin/users/${encodeURIComponent(creatorId)}`,
    { method: "GET" },
  );
  const base = mapUserRow(payload);

  return {
    ...base,
    latestUpload: normalizeHealth(payload.latest_upload ?? payload.upload ?? payload.last_upload),
    latestReport: normalizeHealth(payload.latest_report ?? payload.report ?? payload.last_report),
    fetchedAtIso: new Date().toISOString(),
  };
}

export async function updateAdminUserBlocked(creatorId: string, blocked: boolean): Promise<AdminUserRow> {
  const payload = await apiFetchJson<Record<string, unknown>>(
    "admin.users.updateBlocked",
    `/v1/admin/users/${encodeURIComponent(creatorId)}/blocked`,
    {
      method: "PATCH",
      body: JSON.stringify({ blocked }),
    },
  );

  return mapUserRow(payload);
}

export async function updateAdminUserCompUntil(creatorId: string, compUntil: string | null): Promise<AdminUserRow> {
  const payload = await apiFetchJson<Record<string, unknown>>(
    "admin.users.updateCompUntil",
    `/v1/admin/users/${encodeURIComponent(creatorId)}/comp_until`,
    {
      method: "PATCH",
      body: JSON.stringify({ comp_until: compUntil }),
    },
  );

  return mapUserRow(payload);
}
