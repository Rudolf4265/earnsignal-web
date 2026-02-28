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
  const withHttpPath = source.replace('from "./http";', 'from "../src/lib/api/http.ts";');
  const patched = withHttpPath.replace('from "./client";', 'from "./mocks/api-client.ts";');

  const outDir = path.resolve(".tmp-tests");
  await mkdir(path.join(outDir, "mocks"), { recursive: true });

  const mockPath = path.join(outDir, "mocks", "api-client.ts");
  await writeFile(
    mockPath,
    `export async function apiClientJson(path, init = {}) {
      const headers = { ...(init.headers ?? {}), Authorization: "Bearer test-token" };
      const response = await fetch(path, { ...init, headers });
      return JSON.parse(await response.text());
    }\n`,
    "utf8",
  );

  const outFile = path.join(outDir, `entitlements-auth-${tag}.ts`);
  await writeFile(outFile, patched, "utf8");
  return pathToFileURL(outFile).href;
}

test("fetchEntitlements attaches Authorization header when a session token exists", async () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;
  global.window = createWindow();

  const headersSeen = [];
  global.fetch = async (_url, init = {}) => {
    headersSeen.push(init.headers ?? {});
    return jsonResponse({ plan: "plan_a", status: "active", entitled: true, features: { app: true } });
  };

  try {
    const moduleUrl = await buildEntitlementsTestModule(Date.now());
    const { fetchEntitlements, resetEntitlementsCache } = await import(moduleUrl);

    await fetchEntitlements({ forceRefresh: true });

    const firstHeaders = headersSeen[0];
    assert.equal(firstHeaders.Authorization, "Bearer test-token");

    resetEntitlementsCache();
  } finally {
    global.fetch = originalFetch;
    global.window = originalWindow;
  }
});
