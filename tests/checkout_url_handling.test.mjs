import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
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

const moduleUrl = pathToFileURL(path.resolve("src/lib/api/entitlements.ts")).href;

test("createCheckoutSession uses only primary endpoint when primary succeeds", async () => {
  const calls = [];
  global.window = createWindow();
  global.fetch = async (url) => {
    calls.push(String(url));
    return jsonResponse({ checkout_url: "https://checkout.stripe.test/session_123" });
  };

  const { createCheckoutSession, clearCheckoutAttempt } = await import(`${moduleUrl}?t=${Date.now()}`);
  const response = await createCheckoutSession("plan_a");

  assert.equal(response.checkout_url, "https://checkout.stripe.test/session_123");
  assert.equal(calls.length, 1);
  assert.match(calls[0], /^https:\/\/api\.earnsigma\.com\/v1\/billing\/checkout$/);

  clearCheckoutAttempt();
  delete global.fetch;
  delete global.window;
});

test("createCheckoutSession calls fallback only on 404", async () => {
  const calls = [];
  global.window = createWindow();
  global.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).endsWith("/v1/billing/checkout")) {
      return jsonResponse({}, 404);
    }

    return jsonResponse({ url: "https://checkout.stripe.test/session_456" });
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
  global.window = createWindow();
  global.fetch = async (url) => {
    calls.push(String(url));
    return jsonResponse({}, 500);
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

  global.window = createWindow();
  global.fetch = async (url) => {
    calls.push(String(url));
    await blocked;
    return jsonResponse({ checkoutUrl: "https://checkout.stripe.test/session_789" });
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
