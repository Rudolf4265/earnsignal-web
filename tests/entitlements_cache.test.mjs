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
  assert.equal(first.planTier, "basic");
  assert.equal(first.plan_tier, "basic");
  assert.equal(first.plan, "basic");
  assert.equal(first.isActive, true);
  assert.equal(first.canUpload, true);
  assert.equal(second.entitled, true);

  resetEntitlementsCache();
  delete global.window;
  delete global.fetch;
});

test("fetchEntitlements prefers canonical plan_tier and is_active while preserving legacy fallback", async () => {
  global.window = createWindow();
  global.fetch = async () =>
    jsonResponse({
      plan: "plan_a",
      plan_tier: "pro",
      status: "inactive",
      entitled: false,
      is_active: true,
      source: "stripe",
      can_upload: false,
      can_generate_report: true,
      can_view_reports: true,
      can_download_pdf: true,
      can_access_dashboard: true,
      reports_remaining_this_period: 7,
      reports_generated_this_period: 3,
      monthly_report_limit: 10,
      features: { app: false, upload: false, report: false },
    });

  const moduleUrl = await buildEntitlementsTestModule(`canonical-${Date.now()}`);
  const { fetchEntitlements, resetEntitlementsCache } = await import(moduleUrl);

  const value = await fetchEntitlements({ forceRefresh: true });

  assert.equal(value.planTier, "pro");
  assert.equal(value.plan_tier, "pro");
  assert.equal(value.plan, "pro");
  assert.equal(value.isActive, true);
  assert.equal(value.entitled, true);
  assert.equal(value.source, "stripe");
  assert.equal(value.canUpload, false);
  assert.equal(value.canGenerateReport, true);
  assert.equal(value.canViewReports, true);
  assert.equal(value.canDownloadPdf, true);
  assert.equal(value.canAccessDashboard, true);
  assert.equal(value.reportsRemainingThisPeriod, 7);
  assert.equal(value.reportsGeneratedThisPeriod, 3);
  assert.equal(value.monthlyReportLimit, 10);

  resetEntitlementsCache();
  delete global.window;
  delete global.fetch;
});

test("fetchEntitlements defaults plan tier to none when backend omits both canonical and legacy plan fields", async () => {
  global.window = createWindow();
  global.fetch = async () =>
    jsonResponse({
      status: "inactive",
      is_active: false,
      features: { app: true, upload: true, report: false },
    });

  const moduleUrl = await buildEntitlementsTestModule(`defaults-${Date.now()}`);
  const { fetchEntitlements, resetEntitlementsCache } = await import(moduleUrl);
  const value = await fetchEntitlements({ forceRefresh: true });

  assert.equal(value.planTier, "none");
  assert.equal(value.plan_tier, "none");
  assert.equal(value.plan, "none");
  assert.equal(value.isActive, false);
  assert.equal(value.canUpload, true);
  assert.equal(value.canGenerateReport, false);
  assert.equal(value.canAccessDashboard, true);

  resetEntitlementsCache();
  delete global.window;
  delete global.fetch;
});

test("fetchEntitlements force refresh bypasses cache", async () => {
  let fetchCalls = 0;

  global.window = createWindow();
  global.fetch = async () => {
    fetchCalls += 1;
    return jsonResponse({ plan_tier: "pro", status: "active", is_active: true, features: { app: true } });
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
