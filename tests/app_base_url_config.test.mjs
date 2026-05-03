import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const modulePath = pathToFileURL(path.resolve("src/lib/urls.ts")).href;

function load(tag) {
  return import(`${modulePath}?t=${tag}`);
}

test("appBaseUrl uses NEXT_PUBLIC_APP_URL when set — localhost:3000 case", async () => {
  process.env.NEXT_PUBLIC_PRIMARY_DOMAIN = "localhost";
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

  const { appBaseUrl } = await load(`${Date.now()}-app-url-override`);

  assert.equal(appBaseUrl, "http://localhost:3000");
  assert.ok(
    !appBaseUrl.includes("app.localhost"),
    "appBaseUrl must not contain app.localhost when NEXT_PUBLIC_APP_URL is set",
  );

  delete process.env.NEXT_PUBLIC_APP_URL;
});

test("appBaseUrl strips trailing slash from NEXT_PUBLIC_APP_URL", async () => {
  process.env.NEXT_PUBLIC_PRIMARY_DOMAIN = "localhost";
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000/";

  const { appBaseUrl } = await load(`${Date.now()}-trailing-slash`);

  assert.equal(appBaseUrl, "http://localhost:3000");

  delete process.env.NEXT_PUBLIC_APP_URL;
});

test("appBaseUrl falls back to derived app.PRIMARY_DOMAIN when NEXT_PUBLIC_APP_URL is not set", async () => {
  process.env.NEXT_PUBLIC_PRIMARY_DOMAIN = "localhost";
  delete process.env.NEXT_PUBLIC_APP_URL;

  const { appBaseUrl } = await load(`${Date.now()}-derived-fallback`);

  assert.equal(appBaseUrl, "http://app.localhost");
});

test("appBaseUrl is unaffected by NEXT_PUBLIC_APP_URL being empty string — falls back to derived", async () => {
  process.env.NEXT_PUBLIC_PRIMARY_DOMAIN = "localhost";
  process.env.NEXT_PUBLIC_APP_URL = "";

  const { appBaseUrl } = await load(`${Date.now()}-empty-string`);

  assert.equal(appBaseUrl, "http://app.localhost");

  delete process.env.NEXT_PUBLIC_APP_URL;
});

test("stripeSuccessUrl and stripeCancelUrl use the overridden appBaseUrl", async () => {
  process.env.NEXT_PUBLIC_PRIMARY_DOMAIN = "localhost";
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

  const { stripeSuccessUrl, stripeCancelUrl } = await load(`${Date.now()}-stripe-urls`);

  assert.equal(stripeSuccessUrl, "http://localhost:3000/app/billing/success");
  assert.equal(stripeCancelUrl, "http://localhost:3000/app/billing/cancel");

  delete process.env.NEXT_PUBLIC_APP_URL;
});
