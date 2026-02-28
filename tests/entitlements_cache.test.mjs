import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

function createWindow(hostname = "app.earnsigma.com") {
  const store = new Map();
  return {
    location: { hostname, protocol: hostname.includes("localhost") ? "http:" : "https:" },
    sessionStorage: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
    },
  };
}

function jsonResponse(payload, status = 200) {
  return {
    status,
    ok: status >= 200 && status < 300,
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
      const response = await fetch(path, init);
      return JSON.parse(await response.text());
    }\n`,
    "utf8",
  );
  const outFile = path.join(outDir, `entitlements-${tag}.ts`);
  await writeFile(outFile, patched, "utf8");
  return pathToFileURL(outFile).href;
}

test("fetchEntitlements caches response in memory and sessionStorage", async () => {
  let fetchCalls = 0;

  global.window = createWindow();
  global.fetch = async () => {
    fetchCalls += 1;
    return jsonResponse({ plan: "plan_a", status: "active", entitled: true, features: { app: true, upload: true } });
  };

  const moduleUrl = await buildEntitlementsTestModule(`cache-${Date.now()}`);
  const { fetchEntitlements, resetEntitlementsCache } = await import(moduleUrl);

  const first = await fetchEntitlements();
  const second = await fetchEntitlements();

  assert.equal(fetchCalls, 1);
  assert.equal(first.plan, "plan_a");
  assert.equal(second.entitled, true);

  resetEntitlementsCache();
  delete global.window;
  delete global.fetch;
});

test("fetchEntitlements force refresh bypasses cache", async () => {
  let fetchCalls = 0;

  global.window = createWindow();
  global.fetch = async () => {
    fetchCalls += 1;
    return jsonResponse({ plan: "plan_b", status: "active", entitled: true, features: { app: true } });
  };

  const moduleUrl = await buildEntitlementsTestModule(`force-${Date.now()}`);
  const { fetchEntitlements, resetEntitlementsCache } = await import(moduleUrl);

  await fetchEntitlements();
  await fetchEntitlements({ forceRefresh: true });

  assert.equal(fetchCalls, 2);

  resetEntitlementsCache();
  delete global.window;
  delete global.fetch;
});
