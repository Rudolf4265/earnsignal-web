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
  const mockSpecifier = `./mocks/api-client-${tag}`;
  const patched = source.replace('from "./client";', `from "${mockSpecifier}";`);
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
      const response = await fetch(path, init);
      return JSON.parse(await response.text());
    }\n`,
    "utf8",
  );
  const outFile = path.join(outDir, `billing-status-${tag}.ts`);
  await writeFile(outFile, patched, "utf8");
  return pathToFileURL(outFile).href;
}

test("fetchBillingStatus maps canonical response fields and caches result", async () => {
  const calls = [];
  global.window = createWindow();
  global.fetch = async (url) => {
    calls.push(String(url));
    return jsonResponse({
      plan_tier: "pro",
      status: "active",
      source: "stripe",
      is_active: true,
      reports_remaining_this_period: 5,
      reports_generated_this_period: 3,
      monthly_report_limit: 8,
      current_period_end: "2026-04-01T00:00:00Z",
      cancel_at_period_end: false,
      portal_url: "https://stripe.test/portal",
    });
  };

  const moduleUrl = await buildEntitlementsTestModule(`canonical-${Date.now()}`);
  const { fetchBillingStatus, resetEntitlementsCache } = await import(moduleUrl);
  const first = await fetchBillingStatus();
  const second = await fetchBillingStatus();

  assert.equal(calls.length, 1);
  assert.equal(first.planTier, "pro");
  assert.equal(first.status, "active");
  assert.equal(first.isActive, true);
  assert.equal(first.source, "stripe");
  assert.equal(first.reportsRemainingThisPeriod, 5);
  assert.equal(first.reportsGeneratedThisPeriod, 3);
  assert.equal(first.monthlyReportLimit, 8);
  assert.equal(first.currentPeriodEnd, "2026-04-01T00:00:00Z");
  assert.equal(first.cancelAtPeriodEnd, false);
  assert.equal(first.portalUrl, "https://stripe.test/portal");
  assert.equal(second.plan, "pro");

  resetEntitlementsCache();
  delete global.window;
  delete global.fetch;
});

test("fetchBillingStatus falls back to legacy aliases when canonical fields are absent", async () => {
  global.window = createWindow();
  global.fetch = async () =>
    jsonResponse({
      plan: "plan_a",
      status: "inactive",
      entitled: true,
      features: { app: true, upload: true, report: false },
      portalUrl: "https://stripe.test/portal-legacy",
      currentPeriodEnd: "2026-04-02T00:00:00Z",
      cancelAtPeriodEnd: true,
    });

  const moduleUrl = await buildEntitlementsTestModule(`legacy-${Date.now()}`);
  const { fetchBillingStatus, resetEntitlementsCache } = await import(moduleUrl);
  const value = await fetchBillingStatus({ forceRefresh: true });

  assert.equal(value.planTier, "basic");
  assert.equal(value.plan_tier, "basic");
  assert.equal(value.entitled, true);
  assert.equal(value.isActive, true);
  assert.equal(value.portalUrl, "https://stripe.test/portal-legacy");
  assert.equal(value.currentPeriodEnd, "2026-04-02T00:00:00Z");
  assert.equal(value.cancelAtPeriodEnd, true);

  resetEntitlementsCache();
  delete global.window;
  delete global.fetch;
});

test("fetchBillingStatus force refresh bypasses cache", async () => {
  let fetchCalls = 0;

  global.window = createWindow();
  global.fetch = async () => {
    fetchCalls += 1;
    return jsonResponse({ plan_tier: "basic", status: "active", is_active: true });
  };

  const moduleUrl = await buildEntitlementsTestModule(`force-${Date.now()}`);
  const { fetchBillingStatus, resetEntitlementsCache } = await import(moduleUrl);

  await fetchBillingStatus();
  await fetchBillingStatus({ forceRefresh: true });
  assert.equal(fetchCalls, 2);

  resetEntitlementsCache();
  delete global.window;
  delete global.fetch;
});
