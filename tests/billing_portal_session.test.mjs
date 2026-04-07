import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

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
  const mockSpecifier = `./mocks/api-client-${tag}.mjs`;
  const patched = source
    .replace('from "./client";', `from "${mockSpecifier}";`)
    .replace('from "../entitlements/model";', 'from "../src/lib/entitlements/model.ts";');
  const outDir = path.resolve(".tmp-tests");
  await mkdir(path.join(outDir, "mocks"), { recursive: true });

  const mockPath = path.join(outDir, "mocks", `api-client-${tag}.mjs`);
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
      const parsed = JSON.parse(await response.text());
      if (!response.ok) {
        throw new ApiError({ status: response.status, message: "request failed" });
      }

      return parsed;
    }\n`,
    "utf8",
  );

  const outFile = path.join(outDir, `entitlements-portal-${tag}.ts`);
  await writeFile(outFile, patched, "utf8");
  return pathToFileURL(outFile).href;
}

test("createBillingPortalSession uses the canonical portal endpoint", async () => {
  const calls = [];
  global.fetch = async (url, init = {}) => {
    calls.push([String(url), String(init.method ?? "GET")]);
    return jsonResponse({ portal_url: "https://billing.stripe.test/session_123" });
  };

  const moduleUrl = await buildEntitlementsTestModule(`portal-${Date.now()}`);
  const { createBillingPortalSession } = await import(moduleUrl);
  const response = await createBillingPortalSession();

  assert.equal(response.portal_url, "https://billing.stripe.test/session_123");
  assert.deepEqual(calls, [["/v1/billing/create-portal-session", "POST"]]);
});

test("createBillingPortalSession fails when the backend omits the portal URL", async () => {
  global.fetch = async () => jsonResponse({ ok: true });

  const moduleUrl = await buildEntitlementsTestModule(`portal-missing-${Date.now()}`);
  const { createBillingPortalSession } = await import(moduleUrl);

  await assert.rejects(createBillingPortalSession(), /Billing portal URL missing from response/);
});
