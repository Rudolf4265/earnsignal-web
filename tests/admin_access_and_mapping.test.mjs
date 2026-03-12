import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const gatingUrl = pathToFileURL(path.resolve("src/lib/gating/app-gate.ts")).href;
const adminSourcePath = path.resolve("src/lib/api/admin.ts");
async function buildAdminModule(tag) {
  const source = await readFile(adminSourcePath, "utf8");
  const patched = source
    .replace("./client", "../src/lib/api/client")
    .replace("../auth/isSessionExpiredError", "../src/lib/auth/isSessionExpiredError");
  const outDir = path.resolve(".tmp-tests");
  await mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, `admin-${tag}.ts`);
  await writeFile(outFile, patched, "utf8");
  return pathToFileURL(outFile).href;
}


test("deriveAppGateState keeps entitled admins in authed_entitled", async () => {
  const { deriveAppGateState } = await import(`${gatingUrl}?t=${Date.now()}`);

  const decision = deriveAppGateState({
    isSessionKnown: true,
    session: { user: { id: "admin_1" } },
    entitlements: { status: "entitled", entitlements: { plan: "pro", status: "active", entitled: true, features: { app: true } } },
    isAdmin: true,
  });

  assert.equal(decision, "authed_entitled");
});

test("fetchAdminUsers maps backend fields to frontend shape", async () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;

  const sessionWindow = {
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };

  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  global.window = sessionWindow;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    headers: { get: () => "application/json" },
    text: async () => JSON.stringify({
      mode: "search",
      items: [
        {
          creator_id: "creator_123",
          email: "admin@example.com",
          email_state: "present",
          effective_plan_tier: "pro",
          plan_tier: "B",
          entitlement_source: "admin_override",
          entitlement_status: "active",
          is_blocked: true,
          comp_until: "2026-03-01T00:00:00Z",
          last_upload_status: "ready",
          last_upload_at: "2026-02-01T00:00:00Z",
          last_report_status: "succeeded",
          last_report_at: "2026-02-02T00:00:00Z",
          created_at: "2026-01-01T00:00:00Z",
          last_updated_at: "2026-02-03T00:00:00Z",
        },
      ],
      total: 1,
    }),
  });

  try {
    const adminApiUrl = await buildAdminModule(Date.now());
    const { fetchAdminUsers } = await import(`${adminApiUrl}?t=${Date.now()}`);
    const result = await fetchAdminUsers();

    assert.equal(result.total, 1);
    assert.equal(result.mode, "search");
    assert.deepEqual(result.users[0], {
      creatorId: "creator_123",
      email: "admin@example.com",
      emailState: "present",
      plan: "pro",
      planTier: "B",
      status: "active",
      entitlementSource: "admin_override",
      blocked: true,
      archived: false,
      archivedAt: null,
      archivedReason: null,
      deletedAt: null,
      deletedReason: null,
      compUntil: "2026-03-01T00:00:00Z",
      uploadState: "ready",
      uploadAt: "2026-02-01T00:00:00Z",
      reportState: "succeeded",
      reportAt: "2026-02-02T00:00:00Z",
      createdAt: "2026-01-01T00:00:00Z",
      lastUpdatedAt: "2026-02-03T00:00:00Z",
    });
  } finally {
    global.fetch = originalFetch;
    global.window = originalWindow;
  }
});

test("fetchAdminUsers marks missing email rows explicitly", async () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;

  const sessionWindow = {
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };

  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  global.window = sessionWindow;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    headers: { get: () => "application/json" },
    text: async () =>
      JSON.stringify({
        mode: "recent",
        items: [
          {
            creator_id: "creator_missing_email",
            email: null,
            email_state: "missing",
            effective_plan_tier: "none",
            entitlement_source: "none",
            entitlement_status: "inactive",
            is_blocked: false,
          },
        ],
      }),
  });

  try {
    const adminApiUrl = await buildAdminModule(`${Date.now()}-missing-email`);
    const { fetchAdminUsers } = await import(`${adminApiUrl}?t=${Date.now()}-missing-email`);
    const result = await fetchAdminUsers();

    assert.equal(result.mode, "recent");
    assert.equal(result.users[0].email, null);
    assert.equal(result.users[0].emailState, "missing");
    assert.equal(result.users[0].archived, false);
    assert.equal(result.users[0].deletedAt, null);
  } finally {
    global.fetch = originalFetch;
    global.window = originalWindow;
  }
});

test("fetchAdminUsers derives health columns from nested latest upload/report payloads", async () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;

  const sessionWindow = {
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };

  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  global.window = sessionWindow;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    headers: { get: () => "application/json" },
    text: async () =>
      JSON.stringify({
        mode: "search",
        items: [
          {
            creator_id: "creator_nested_1",
            email: "nested@example.com",
            email_state: "present",
            effective_plan_tier: "pro",
            entitlement_source: "admin_override",
            entitlement_status: "active",
            latest_upload: {
              id: "up_nested_1",
              status: "processing",
              created_at: "2026-02-05T00:00:00Z",
            },
            latestReport: {
              id: "rep_nested_1",
              status: "queued",
              createdAt: "2026-02-06T00:00:00Z",
            },
          },
        ],
      }),
  });

  try {
    const adminApiUrl = await buildAdminModule(`${Date.now()}-nested-health`);
    const { fetchAdminUsers } = await import(`${adminApiUrl}?t=${Date.now()}-nested-health`);
    const result = await fetchAdminUsers("nested@example.com");

    assert.equal(result.mode, "search");
    assert.equal(result.users.length, 1);
    assert.equal(result.users[0].uploadState, "processing");
    assert.equal(result.users[0].uploadAt, "2026-02-05T00:00:00Z");
    assert.equal(result.users[0].reportState, "queued");
    assert.equal(result.users[0].reportAt, "2026-02-06T00:00:00Z");
    assert.equal(result.users[0].archived, false);
  } finally {
    global.fetch = originalFetch;
    global.window = originalWindow;
  }
});

test("fetchAdminUsers forwards include_archived toggle to backend", async () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;
  const calls = [];

  const sessionWindow = {
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };

  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  global.window = sessionWindow;
  global.fetch = async (input, init) => {
    calls.push({ input: String(input), init });
    return {
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      text: async () => JSON.stringify({ mode: "search", items: [] }),
    };
  };

  try {
    const adminApiUrl = await buildAdminModule(`${Date.now()}-include-archived`);
    const { fetchAdminUsers } = await import(`${adminApiUrl}?t=${Date.now()}-include-archived`);
    await fetchAdminUsers("archived@example.com", { includeArchived: true });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].input.includes("query=archived%40example.com"), true);
    assert.equal(calls[0].input.includes("include_archived=true"), true);
  } finally {
    global.fetch = originalFetch;
    global.window = originalWindow;
  }
});

test("fetchAdminUserDetail normalizes nested latest upload/report detail fields", async () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;
  const calls = [];

  const sessionWindow = {
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };

  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  global.window = sessionWindow;
  global.fetch = async (input, init) => {
    calls.push({ input: String(input), init });
    return {
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      text: async () =>
        JSON.stringify({
          creator_id: "creator_detail_1",
          email: "detail@example.com",
          email_state: "present",
          effective_plan_tier: "pro",
          entitlement_source: "admin_override",
          entitlement_status: "active",
          access_granted: true,
          access_reason_code: "support_grant",
          billing_required: false,
          latest_upload: {
            upload_id: "up_detail_1",
            status: "failed",
            created_at: "2026-03-01T00:00:00Z",
            ready_at: "2026-03-01T01:00:00Z",
            failed_reason: "parse_error",
            link: "https://uploads.example.test/up_detail_1",
          },
          latest_report: {
            report_id: "rep_detail_1",
            status: "failed",
            createdAt: "2026-03-02T00:00:00Z",
            finishedAt: "2026-03-02T01:00:00Z",
            failure_code: "report_timeout",
            url: "https://reports.example.test/rep_detail_1",
          },
        }),
    };
  };

  try {
    const adminApiUrl = await buildAdminModule(`${Date.now()}-detail-health`);
    const { fetchAdminUserDetail } = await import(`${adminApiUrl}?t=${Date.now()}-detail-health`);
    const result = await fetchAdminUserDetail("creator_detail_1");

    assert.equal(calls.length, 1);
    assert.equal(calls[0].input.endsWith("/v1/admin/users/creator_detail_1/entitlement"), true);

    assert.equal(result.creatorId, "creator_detail_1");
    assert.equal(result.accessGranted, true);
    assert.equal(result.accessReasonCode, "support_grant");
    assert.equal(result.archived, false);
    assert.equal(result.deletedAt, null);

    assert.equal(result.latestUpload?.id, "up_detail_1");
    assert.equal(result.latestUpload?.status, "failed");
    assert.equal(result.latestUpload?.createdAt, "2026-03-01T00:00:00Z");
    assert.equal(result.latestUpload?.readyAt, "2026-03-01T01:00:00Z");
    assert.equal(result.latestUpload?.failedReason, "parse_error");
    assert.equal(result.latestUpload?.link, "https://uploads.example.test/up_detail_1");

    assert.equal(result.latestReport?.id, "rep_detail_1");
    assert.equal(result.latestReport?.status, "failed");
    assert.equal(result.latestReport?.createdAt, "2026-03-02T00:00:00Z");
    assert.equal(result.latestReport?.finishedAt, "2026-03-02T01:00:00Z");
    assert.equal(result.latestReport?.failureCode, "report_timeout");
    assert.equal(result.latestReport?.link, "https://reports.example.test/rep_detail_1");
  } finally {
    global.fetch = originalFetch;
    global.window = originalWindow;
  }
});

test("grantAdminAccessByEmail maps success response into detail shape", async () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;
  const calls = [];

  const sessionWindow = {
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };

  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  global.window = sessionWindow;
  global.fetch = async (input, init) => {
    calls.push({ input: String(input), init });
    return {
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      text: async () =>
        JSON.stringify({
          user_id: "creator_123",
          creator_id: "creator_123",
          email: "admin@example.com",
          email_state: "present",
          effective_plan_tier: "pro",
          plan_tier: "B",
          entitlement_source: "admin_override",
          entitlement_status: "active",
          access_granted: true,
          access_reason_code: "support_grant",
          billing_required: false,
          status: "active",
          billing_status: "incomplete",
          comp_until: "2026-03-01T00:00:00Z",
          created_at: "2026-01-01T00:00:00Z",
          last_updated_at: "2026-02-03T00:00:00Z",
          latest_upload: { upload_id: "up_1", status: "ready", created_at: "2026-02-01T00:00:00Z" },
          latest_report: { report_id: "rep_1", status: "succeeded", created_at: "2026-02-02T00:00:00Z" },
        }),
    };
  };

  try {
    const adminApiUrl = await buildAdminModule(`${Date.now()}-grant-success`);
    const { grantAdminAccessByEmail } = await import(`${adminApiUrl}?t=${Date.now()}-grant-success`);

    const result = await grantAdminAccessByEmail({
      email: "admin@example.com",
      planTier: "B",
      endsAtIso: "2026-03-01T00:00:00Z",
      note: "ops",
    });

    assert.equal(result.creatorId, "creator_123");
    assert.equal(result.email, "admin@example.com");
    assert.equal(result.accessGranted, true);
    assert.equal(result.latestUpload?.status, "ready");
    assert.equal(result.latestReport?.status, "succeeded");

    assert.equal(calls.length, 1);
    assert.equal(calls[0].input.endsWith("/v1/admin/users/grant-access-by-email"), true);
    const requestBody = JSON.parse(String(calls[0].init?.body ?? "{}"));
    assert.equal(requestBody.email, "admin@example.com");
    assert.equal(requestBody.plan_tier, "B");
  } finally {
    global.fetch = originalFetch;
    global.window = originalWindow;
  }
});

test("updateAdminUserArchived maps lifecycle response into detail shape", async () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;
  const calls = [];

  const sessionWindow = {
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };

  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  global.window = sessionWindow;
  global.fetch = async (input, init) => {
    calls.push({ input: String(input), init });
    return {
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      text: async () =>
        JSON.stringify({
          creator_id: "creator-archive-api",
          email: "archive.api@example.com",
          email_state: "present",
          effective_plan_tier: "pro",
          entitlement_source: "admin_override",
          entitlement_status: "active",
          access_granted: true,
          billing_required: false,
          is_archived: true,
          archived_at: "2026-03-10T01:00:00Z",
          archived_reason: "inactive_lifecycle",
          deleted_at: null,
        }),
    };
  };

  try {
    const adminApiUrl = await buildAdminModule(`${Date.now()}-archive-success`);
    const { updateAdminUserArchived } = await import(`${adminApiUrl}?t=${Date.now()}-archive-success`);
    const result = await updateAdminUserArchived("creator-archive-api", { archived: true, reason: "inactive_lifecycle" });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].input.endsWith("/v1/admin/users/creator-archive-api/archive"), true);
    assert.equal(result.creatorId, "creator-archive-api");
    assert.equal(result.archived, true);
    assert.equal(result.archivedReason, "inactive_lifecycle");
    const requestBody = JSON.parse(String(calls[0].init?.body ?? "{}"));
    assert.equal(requestBody.archived, true);
    assert.equal(requestBody.reason, "inactive_lifecycle");
  } finally {
    global.fetch = originalFetch;
    global.window = originalWindow;
  }
});

test("deleteAdminUser requires confirmation and maps deleted lifecycle state", async () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;
  const calls = [];

  const sessionWindow = {
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };

  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  global.window = sessionWindow;
  global.fetch = async (input, init) => {
    calls.push({ input: String(input), init });
    return {
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      text: async () =>
        JSON.stringify({
          creator_id: "creator-delete-api",
          email: "delete.api@example.com",
          email_state: "present",
          effective_plan_tier: "none",
          entitlement_source: "none",
          entitlement_status: "blocked",
          access_granted: false,
          billing_required: true,
          is_archived: true,
          archived_at: "2026-03-10T01:00:00Z",
          deleted_at: "2026-03-10T01:00:00Z",
          deleted_reason: "cleanup",
          is_blocked: true,
        }),
    };
  };

  try {
    const adminApiUrl = await buildAdminModule(`${Date.now()}-delete-success`);
    const { deleteAdminUser } = await import(`${adminApiUrl}?t=${Date.now()}-delete-success`);
    const result = await deleteAdminUser("creator-delete-api", { confirmation: "DELETE", reason: "cleanup" });

    assert.equal(calls.length, 1);
    assert.equal(calls[0].input.endsWith("/v1/admin/users/creator-delete-api/delete"), true);
    assert.equal(result.creatorId, "creator-delete-api");
    assert.equal(result.deletedAt, "2026-03-10T01:00:00Z");
    assert.equal(result.deletedReason, "cleanup");

    const requestBody = JSON.parse(String(calls[0].init?.body ?? "{}"));
    assert.equal(requestBody.confirmation, "DELETE");
    assert.equal(requestBody.reason, "cleanup");

    await assert.rejects(
      () => deleteAdminUser("creator-delete-api", { confirmation: "   " }),
      (error) => {
        assert.equal(error instanceof Error, true);
        assert.equal(error.message.includes("Delete confirmation is required"), true);
        return true;
      },
    );
  } finally {
    global.fetch = originalFetch;
    global.window = originalWindow;
  }
});

test("grantAdminAccessByEmail surfaces not-found responses", async () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;

  const sessionWindow = {
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };

  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  global.window = sessionWindow;
  global.fetch = async () => ({
    ok: false,
    status: 404,
    headers: {
      get: (header) => (String(header).toLowerCase() === "content-type" ? "application/json" : null),
    },
    text: async () =>
      JSON.stringify({
        error: {
          code: "NOT_FOUND",
          message: "No user account exists for this email.",
          details: { email: "missing.user@example.com" },
        },
      }),
  });

  try {
    const adminApiUrl = await buildAdminModule(`${Date.now()}-grant-not-found`);
    const { grantAdminAccessByEmail } = await import(`${adminApiUrl}?t=${Date.now()}-grant-not-found`);

    await assert.rejects(
      () =>
        grantAdminAccessByEmail({
          email: "missing.user@example.com",
          planTier: "B",
        }),
      (error) => {
        assert.equal(error instanceof Error, true);
        assert.equal(error.message.includes("No user account exists for this email"), true);
        return true;
      },
    );
  } finally {
    global.fetch = originalFetch;
    global.window = originalWindow;
  }
});

test("fetchAdminUsers surfaces backend 403 denial for non-admin callers", async () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;

  const sessionWindow = {
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
  };

  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  global.window = sessionWindow;
  global.fetch = async () => ({
    ok: false,
    status: 403,
    headers: {
      get: (header) => (String(header).toLowerCase() === "content-type" ? "application/json" : null),
    },
    text: async () =>
      JSON.stringify({
        code: "FORBIDDEN",
        message: "Admin role required",
        details: { access_reason_code: "ADMIN_REQUIRED" },
      }),
  });

  try {
    const adminApiUrl = await buildAdminModule(`${Date.now()}-forbidden`);
    const { fetchAdminUsers } = await import(`${adminApiUrl}?t=${Date.now()}-forbidden`);

    await assert.rejects(
      () => fetchAdminUsers(),
      (error) => {
        assert.equal(error instanceof Error, true);
        assert.equal(error.message.includes("Admin role required"), true);
        return true;
      },
    );
  } finally {
    global.fetch = originalFetch;
    global.window = originalWindow;
  }
});
