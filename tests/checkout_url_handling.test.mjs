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

test("createCheckoutSession uses only primary endpoint when primary succeeds", async () => {
  const calls = [];
  global.window = { sessionStorage: createSessionStorage() };
  global.fetch = async (url) => {
    calls.push(String(url));
    return {
      status: 200,
      ok: true,
      json: async () => ({ checkout_url: "https://checkout.stripe.test/session_123" }),
    };
  };

  const { createCheckoutSession, clearCheckoutAttempt } = await import(`${moduleUrl}?t=${Date.now()}`);
  const response = await createCheckoutSession("plan_a");

  assert.equal(response.checkout_url, "https://checkout.stripe.test/session_123");
  assert.deepEqual(calls, ["/v1/billing/checkout"]);

  clearCheckoutAttempt();
  delete global.fetch;
  delete global.window;
});

test("createCheckoutSession calls fallback only on 404", async () => {
  const calls = [];
  global.window = { sessionStorage: createSessionStorage() };
  global.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).endsWith("/v1/billing/checkout")) {
      return { status: 404, ok: false, json: async () => ({}) };
    }

    return {
      status: 200,
      ok: true,
      json: async () => ({ url: "https://checkout.stripe.test/session_456" }),
    };
  };

  const { createCheckoutSession, clearCheckoutAttempt } = await import(`${moduleUrl}?t=${Date.now() + 1}`);
  const response = await createCheckoutSession("plan_a");

  assert.equal(response.checkout_url, "https://checkout.stripe.test/session_456");
  assert.equal(calls.length, 2);
  assert.match(calls[0], /\/v1\/billing\/checkout$/);
  assert.match(calls[1], /\/v1\/checkout$/);

  clearCheckoutAttempt();
  delete global.fetch;
  delete global.window;
});

test("createCheckoutSession does not call fallback on 500", async () => {
  const calls = [];
  global.window = { sessionStorage: createSessionStorage() };
  global.fetch = async (url) => {
    calls.push(String(url));
    return { status: 500, ok: false, json: async () => ({}) };
  };

  const { createCheckoutSession, clearCheckoutAttempt } = await import(`${moduleUrl}?t=${Date.now() + 2}`);

  await assert.rejects(createCheckoutSession("plan_a"), /500/);
  assert.equal(calls.length, 1);

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

  global.window = { sessionStorage: createSessionStorage() };
  global.fetch = async (url) => {
    calls.push(String(url));
    await blocked;
    return {
      status: 200,
      ok: true,
      json: async () => ({ checkoutUrl: "https://checkout.stripe.test/session_789" }),
    };
  };

  const { createCheckoutSession, clearCheckoutAttempt } = await import(`${moduleUrl}?t=${Date.now() + 3}`);

  const first = createCheckoutSession("plan_a");
  const second = createCheckoutSession("plan_a");
  resolveFetch();

  const [firstResult, secondResult] = await Promise.all([first, second]);

  assert.equal(calls.length, 1);
  assert.equal(firstResult.checkout_url, "https://checkout.stripe.test/session_789");
  assert.equal(secondResult.checkout_url, "https://checkout.stripe.test/session_789");

  clearCheckoutAttempt();
  delete global.fetch;
  delete global.window;
});
