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
