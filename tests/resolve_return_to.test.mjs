import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/auth/resolveReturnTo.ts")).href;

test("resolveReturnTo accepts valid internal paths", async () => {
  const { resolveReturnTo } = await import(`${moduleUrl}?t=${Date.now()}-valid`);

  assert.equal(resolveReturnTo("/app/report/123"), "/app/report/123");
  assert.equal(resolveReturnTo("/app/admin/users?tab=active"), "/app/admin/users?tab=active");
});

test("resolveReturnTo rejects external URLs", async () => {
  const { resolveReturnTo } = await import(`${moduleUrl}?t=${Date.now()}-external`);

  assert.equal(resolveReturnTo("https://evil.example/phish"), null);
});

test("resolveReturnTo rejects protocol-relative paths", async () => {
  const { resolveReturnTo } = await import(`${moduleUrl}?t=${Date.now()}-double-slash`);

  assert.equal(resolveReturnTo("//evil.example/phish"), null);
});

test("resolveReturnTo rejects protocol injection", async () => {
  const { resolveReturnTo } = await import(`${moduleUrl}?t=${Date.now()}-protocol-injection`);

  assert.equal(resolveReturnTo("/app/https://evil.example"), null);
});

test("missing returnTo falls back to /app", async () => {
  const { resolveReturnTo } = await import(`${moduleUrl}?t=${Date.now()}-fallback`);

  assert.equal(resolveReturnTo(null) ?? "/app", "/app");
});
