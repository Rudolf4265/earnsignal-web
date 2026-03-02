import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const modulePath = pathToFileURL(path.resolve("src/lib/config/domains.ts")).href;

function load(tag) {
  return import(`${modulePath}?t=${tag}`);
}

test("canonical host resolution allows configured suffixes outside production", async () => {
  process.env.NODE_ENV = "development";
  process.env.NEXT_PUBLIC_PRIMARY_DOMAIN = "example.com";
  process.env.NEXT_PUBLIC_ALLOWED_HOST_SUFFIXES = ".vercel.app,.example.com";
  const { getCanonicalHosts, isAllowedHost, ALLOWED_HOST_SUFFIXES } = await load(Date.now());

  const hosts = getCanonicalHosts();
  assert.equal(hosts.marketingRootHost, "example.com");
  assert.equal(hosts.marketingHost, "www.example.com");
  assert.equal(hosts.appHost, "app.example.com");
  assert.equal(isAllowedHost("preview-1.vercel.app"), true);
  assert.equal(isAllowedHost("api.example.com"), true);
  assert.equal(ALLOWED_HOST_SUFFIXES.includes(".example.com"), true);
});

test("production host allowlist only permits canonical hosts", async () => {
  process.env.NODE_ENV = "production";
  process.env.NEXT_PUBLIC_PRIMARY_DOMAIN = "example.com";
  process.env.NEXT_PUBLIC_ALLOWED_HOST_SUFFIXES = ".vercel.app,.example.com";
  const { isAllowedHost, ALLOWED_HOST_SUFFIXES } = await load(`${Date.now()}-prod`);

  assert.deepEqual(ALLOWED_HOST_SUFFIXES, []);
  assert.equal(isAllowedHost("example.com"), true);
  assert.equal(isAllowedHost("www.example.com"), true);
  assert.equal(isAllowedHost("app.example.com"), true);
  assert.equal(isAllowedHost("api.example.com"), false);
  assert.equal(isAllowedHost("preview-1.vercel.app"), false);
});
