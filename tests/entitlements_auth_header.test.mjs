import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

function createWindow() {
  const store = new Map();
  return {
    location: { hostname: "app.earnsigma.com", protocol: "https:" },
    sessionStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
    },
  };
}

function jsonResponse(payload) {
  return {
    status: 200,
    ok: true,
    headers: { get: () => "application/json" },
    text: async () => JSON.stringify(payload),
  };
}

async function buildEntitlementsTestModule(tag) {
  const source = await readFile(path.resolve("src/lib/api/entitlements.ts"), "utf8");
  const mockSpecifier = `./mocks/api-client-${tag}`;
  const patched = source
    .replace('from "./client";', `from "${mockSpecifier}";`)
    .replace('from "../entitlements/model";', 'from "../src/lib/entitlements/model";');

  const outDir = path.resolve(".tmp-tests");
  await mkdir(path.join(outDir, "mocks"), { recursive: true });

  const mockPath = path.join(outDir, "mocks", `api-client-${tag}`);
  await writeFile(
    mockPath,
    `export class ApiError extends Error {
      constructor({ status, message }) {
        super(message);
        this.status = status;
      }
    }

    export async function apiFetchJson(_operation, path, init = {}) {
      const headers = { ...(init.headers ?? {}), Authorization: "Bearer test-token" };
      const response = await globalThis.__entitlementsAuthHeaderFetch__(path, { ...init, headers });
      return JSON.parse(await response.text());
    }\n`,
    "utf8",
  );

  const outFile = path.join(outDir, `entitlements-auth-${tag}.ts`);
  await writeFile(outFile, patched, "utf8");
  return pathToFileURL(outFile).href;
}

test("fetchEntitlements attaches Authorization header when a session token exists", async () => {
  const originalWindow = global.window;
  const originalHarnessFetch = global.__entitlementsAuthHeaderFetch__;
  global.window = createWindow();

  const headersSeen = [];
  global.__entitlementsAuthHeaderFetch__ = async (_url, init = {}) => {
    headersSeen.push(init.headers ?? {});
    return jsonResponse({ plan: "plan_a", status: "active", entitled: true, features: { app: true } });
  };

  try {
    const moduleUrl = await buildEntitlementsTestModule(Date.now());
    const { fetchEntitlements, resetEntitlementsCache } = await import(moduleUrl);

    await fetchEntitlements({ forceRefresh: true });

    const withAuth = headersSeen.find((headers) => {
      if (!headers) {
        return false;
      }
      if (typeof headers.Authorization === "string") {
        return headers.Authorization === "Bearer test-token";
      }
      if (typeof headers.get === "function") {
        return headers.get("Authorization") === "Bearer test-token";
      }
      return false;
    });
    assert.ok(withAuth, "expected Authorization header to be present on at least one API request");

    resetEntitlementsCache();
  } finally {
    global.__entitlementsAuthHeaderFetch__ = originalHarnessFetch;
    global.window = originalWindow;
  }
});
