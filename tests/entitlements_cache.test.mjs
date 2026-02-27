import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

function createSessionStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  };
}

const moduleUrl = pathToFileURL(path.resolve("src/lib/api/entitlements.ts")).href;

test("fetchEntitlements caches response in memory and sessionStorage", async () => {
  let fetchCalls = 0;

  global.window = { sessionStorage: createSessionStorage() };
  global.fetch = async () => {
    fetchCalls += 1;
    return {
      ok: true,
      json: async () => ({ plan: "plan_a", status: "active", entitled: true, features: { app: true, upload: true } }),
    };
  };

  const { fetchEntitlements, resetEntitlementsCache } = await import(`${moduleUrl}?t=${Date.now()}`);

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

  global.window = { sessionStorage: createSessionStorage() };
  global.fetch = async () => {
    fetchCalls += 1;
    return {
      ok: true,
      json: async () => ({ plan: "plan_b", status: "active", entitled: true, features: { app: true } }),
    };
  };

  const { fetchEntitlements, resetEntitlementsCache } = await import(`${moduleUrl}?t=${Date.now() + 1}`);

  await fetchEntitlements();
  await fetchEntitlements({ forceRefresh: true });

  assert.equal(fetchCalls, 2);

  resetEntitlementsCache();
  delete global.window;
  delete global.fetch;
});
