import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const gatingUrl = pathToFileURL(path.resolve("src/lib/billing/gating.ts")).href;
const adminApiUrl = pathToFileURL(path.resolve("src/lib/api/admin.ts")).href;

test("decideAppGate allows admin route for admins without entitlement", async () => {
  const { decideAppGate } = await import(`${gatingUrl}?t=${Date.now()}`);

  const decision = decideAppGate({
    hasSession: true,
    isLoadingSession: false,
    isLoadingEntitlements: false,
    isEntitled: false,
    isAdmin: true,
    pathname: "/app/admin",
  });

  assert.equal(decision, "allow");
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

  global.window = sessionWindow;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      users: [
        {
          creator_id: "creator_123",
          email: "admin@example.com",
          plan: "pro",
          status: "active",
          blocked: true,
          comp_until: "2026-03-01T00:00:00Z",
          upload_state: "success",
        },
      ],
      total: 1,
    }),
  });

  try {
    const { fetchAdminUsers } = await import(`${adminApiUrl}?t=${Date.now()}`);
    const result = await fetchAdminUsers();

    assert.equal(result.total, 1);
    assert.deepEqual(result.users[0], {
      creatorId: "creator_123",
      email: "admin@example.com",
      plan: "pro",
      status: "active",
      blocked: true,
      compUntil: "2026-03-01T00:00:00Z",
      uploadState: "success",
    });
  } finally {
    global.fetch = originalFetch;
    global.window = originalWindow;
  }
});
