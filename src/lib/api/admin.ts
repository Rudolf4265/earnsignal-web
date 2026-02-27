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

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
let whoAmICache: AdminWhoAmIResponse | null = null;
let inFlightWhoAmI: Promise<AdminWhoAmIResponse> | null = null;

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const { createClient } = await import("../supabase/client");
    const {
      data: { session },
    } = await createClient().auth.getSession();

    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  } catch {
    return {};
  }
}

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
    const headers = await getAuthHeaders();
    const response = await fetch(`${apiBase}/v1/admin/whoami`, { method: "GET", headers });

    if (!response.ok) {
      return { isAdmin: false, email: null };
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const value = {
      isAdmin: asBoolean(payload.is_admin) || asBoolean(payload.admin) || asBoolean(payload.isAdmin),
      email: asString(payload.email),
    };

    whoAmICache = value;
    return value;
  })();

  try {
    return await inFlightWhoAmI;
  } finally {
    inFlightWhoAmI = null;
  }
}

export async function fetchAdminUsers(search?: string): Promise<AdminUserListResponse> {
  const headers = await getAuthHeaders();
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const response = await fetch(`${apiBase}/v1/admin/users${query}`, { method: "GET", headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch admin users (${response.status})`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
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
  const headers = await getAuthHeaders();
  const response = await fetch(`${apiBase}/v1/admin/users/${encodeURIComponent(creatorId)}`, { method: "GET", headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch admin user detail (${response.status})`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const base = mapUserRow(payload);

  return {
    ...base,
    latestUpload: normalizeHealth(payload.latest_upload ?? payload.upload ?? payload.last_upload),
    latestReport: normalizeHealth(payload.latest_report ?? payload.report ?? payload.last_report),
    fetchedAtIso: new Date().toISOString(),
  };
}

export async function updateAdminUserBlocked(creatorId: string, blocked: boolean): Promise<AdminUserRow> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${apiBase}/v1/admin/users/${encodeURIComponent(creatorId)}/blocked`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ blocked }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update blocked status (${response.status})`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  return mapUserRow(payload);
}

export async function updateAdminUserCompUntil(creatorId: string, compUntil: string | null): Promise<AdminUserRow> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${apiBase}/v1/admin/users/${encodeURIComponent(creatorId)}/comp_until`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ comp_until: compUntil }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update comp_until (${response.status})`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  return mapUserRow(payload);
}
