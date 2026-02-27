import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/api/entitlements.ts")).href;

test("createCheckoutSession falls back endpoint and returns checkout URL", async () => {
  const calls = [];

  global.fetch = async (url) => {
    calls.push(String(url));

    if (String(url).endsWith("/v1/billing/checkout")) {
      return { status: 404, ok: false, json: async () => ({}) };
    }

    return {
      status: 200,
      ok: true,
      json: async () => ({ checkout_url: "https://checkout.stripe.test/session_123" }),
    };
  };

  const { createCheckoutSession } = await import(`${moduleUrl}?t=${Date.now()}`);
  const response = await createCheckoutSession("plan_a");

  assert.equal(response.checkout_url, "https://checkout.stripe.test/session_123");
  assert.equal(calls.length, 2);

  delete global.fetch;
});
