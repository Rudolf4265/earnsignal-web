import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const gatingUrl = pathToFileURL(path.resolve("src/lib/gating/app-gate.ts")).href;
const adminSourcePath = path.resolve("src/lib/api/admin.ts");
async function buildAdminModule(tag) {
  const source = await readFile(adminSourcePath, "utf8");
  const patched = source.replace("./client", "../src/lib/api/client.ts");
  const outDir = path.resolve(".tmp-tests");
  await mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, `admin-${tag}.ts`);
  await writeFile(outFile, patched, "utf8");
  return pathToFileURL(outFile).href;
}


test("deriveAppGateState returns authed_admin for entitled admin users", async () => {
  const { deriveAppGateState } = await import(`${gatingUrl}?t=${Date.now()}`);

  const decision = deriveAppGateState({
    isSessionKnown: true,
    session: { user: { id: "admin_1" } },
    entitlements: { status: "entitled", entitlements: { plan: "pro", status: "active", entitled: true, features: { app: true } } },
    isAdmin: true,
  });

  assert.equal(decision, "authed_admin");
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
    const adminApiUrl = await buildAdminModule(Date.now());
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
