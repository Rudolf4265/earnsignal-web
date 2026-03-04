import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("app host root redirects to /app or /login based on auth cookie", async () => {
  const source = await readFile("proxy.ts", "utf8");

  assert.equal(source.includes('if (pathname === "/")'), true);
  assert.equal(source.includes('hasAppSessionCookie(request) ? "/app" : "/login"'), true);
});

test("marketing host no longer redirects app paths to app host", async () => {
  const source = await readFile("proxy.ts", "utf8");

  assert.equal(source.includes("return redirectToHost(request, APP_HOST);"), false);
});
