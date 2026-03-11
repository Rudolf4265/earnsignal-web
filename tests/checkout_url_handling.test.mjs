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
      const response = await fetch(path, init);
      const parsed = JSON.parse(await response.text());
      if (!response.ok) {
        throw new ApiError({ status: response.status, message: "request failed" });
      }

      return parsed;
    }\n`,
    "utf8",
  );

  const outFile = path.join(outDir, `entitlements-${tag}.ts`);
  await writeFile(outFile, patched, "utf8");
  return pathToFileURL(outFile).href;
}

test("createCheckoutSession uses canonical endpoint when available", async () => {
  const calls = [];
  const requestBodies = [];
  global.window = createWindow();
  global.fetch = async (url, init = {}) => {
    calls.push(String(url));
    requestBodies.push(JSON.parse(String(init.body ?? "{}")));
    return jsonResponse({ checkout_url: "https://checkout.stripe.test/session_123" });
  };

  const moduleUrl = await buildEntitlementsTestModule(`primary-${Date.now()}`);
  const { createCheckoutSession, clearCheckoutAttempt } = await import(moduleUrl);
  const response = await createCheckoutSession("basic");

  assert.equal(response.checkout_url, "https://checkout.stripe.test/session_123");
  assert.equal(calls.length, 1);
  assert.equal(calls[0], "/v1/billing/create-checkout-session");
  assert.deepEqual(requestBodies[0], { plan_tier: "basic" });

  clearCheckoutAttempt();
  delete global.fetch;
  delete global.window;
});

test("createCheckoutSession retries canonical endpoint with legacy payload on validation error", async () => {
  const calls = [];
  const requestBodies = [];

  global.window = createWindow();
  global.fetch = async (url, init = {}) => {
    calls.push(String(url));
    requestBodies.push(JSON.parse(String(init.body ?? "{}")));

    if (calls.length === 1) {
      return jsonResponse({ message: "invalid body" }, 422);
    }

    return jsonResponse({ checkout_url: "https://checkout.stripe.test/session_legacy_payload" });
  };

  const moduleUrl = await buildEntitlementsTestModule(`payload-fallback-${Date.now()}`);
  const { createCheckoutSession, clearCheckoutAttempt } = await import(moduleUrl);
  const response = await createCheckoutSession("pro");

  assert.equal(response.checkout_url, "https://checkout.stripe.test/session_legacy_payload");
  assert.equal(calls.length, 2);
  assert.equal(calls[0], "/v1/billing/create-checkout-session");
  assert.equal(calls[1], "/v1/billing/create-checkout-session");
  assert.deepEqual(requestBodies[0], { plan_tier: "pro" });
  assert.deepEqual(requestBodies[1], { plan: "plan_b" });

  clearCheckoutAttempt();
  delete global.fetch;
  delete global.window;
});

test("createCheckoutSession falls back to legacy endpoint only when canonical endpoint is missing", async () => {
  const calls = [];
  const requestBodies = [];

  global.window = createWindow();
  global.fetch = async (url, init = {}) => {
    calls.push(String(url));
    requestBodies.push(JSON.parse(String(init.body ?? "{}")));
    if (String(url).endsWith("/v1/billing/create-checkout-session")) {
      return jsonResponse({}, 404);
    }

    return jsonResponse({ url: "https://checkout.stripe.test/session_456" });
  };

  const moduleUrl = await buildEntitlementsTestModule(`endpoint-fallback-${Date.now()}`);
  const { createCheckoutSession, clearCheckoutAttempt } = await import(moduleUrl);
  const response = await createCheckoutSession("basic");

  assert.equal(response.checkout_url, "https://checkout.stripe.test/session_456");
  assert.equal(calls.length, 2);
  assert.equal(calls[0], "/v1/billing/create-checkout-session");
  assert.equal(calls[1], "/v1/billing/checkout");
  assert.deepEqual(requestBodies[1], { plan: "plan_a" });

  clearCheckoutAttempt();
  delete global.fetch;
  delete global.window;
});

test("createCheckoutSession does not call legacy endpoints on canonical 500 errors", async () => {
  const calls = [];

  global.window = createWindow();
  global.fetch = async (url) => {
    calls.push(String(url));
    return jsonResponse({}, 500);
  };

  const moduleUrl = await buildEntitlementsTestModule(`error-${Date.now()}`);
  const { createCheckoutSession, clearCheckoutAttempt } = await import(moduleUrl);

  await assert.rejects(createCheckoutSession("basic"), /request failed/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0], "/v1/billing/create-checkout-session");

  clearCheckoutAttempt();
  delete global.fetch;
  delete global.window;
});

test("createCheckoutSession validates selected plan before API request", async () => {
  const calls = [];

  global.window = createWindow();
  global.fetch = async (url) => {
    calls.push(String(url));
    return jsonResponse({});
  };

  const moduleUrl = await buildEntitlementsTestModule(`invalid-plan-${Date.now()}`);
  const { createCheckoutSession, clearCheckoutAttempt } = await import(moduleUrl);

  await assert.rejects(createCheckoutSession("enterprise"), /Invalid checkout plan selected/);
  assert.equal(calls.length, 0);

  clearCheckoutAttempt();
  delete global.fetch;
  delete global.window;
});

test("createCheckoutSession in-flight lock dedupes repeated calls", async () => {
  const calls = [];
  let resolveFetch;
  const blocked = new Promise((resolve) => {
    resolveFetch = resolve;
  });

  global.window = createWindow();
  global.fetch = async (url) => {
    calls.push(String(url));
    await blocked;
    return jsonResponse({ checkoutUrl: "https://checkout.stripe.test/session_789" });
  };

  const moduleUrl = await buildEntitlementsTestModule(`lock-${Date.now()}`);
  const { createCheckoutSession, clearCheckoutAttempt } = await import(moduleUrl);

  const first = createCheckoutSession("basic");
  const second = createCheckoutSession("basic");
  resolveFetch();

  const [firstResult, secondResult] = await Promise.all([first, second]);

  assert.equal(calls.length, 1);
  assert.equal(firstResult.checkout_url, "https://checkout.stripe.test/session_789");
  assert.equal(secondResult.checkout_url, "https://checkout.stripe.test/session_789");

  clearCheckoutAttempt();
  delete global.fetch;
  delete global.window;
});
