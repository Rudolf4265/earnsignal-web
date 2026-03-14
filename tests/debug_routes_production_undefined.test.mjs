import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const modulePath = pathToFileURL(path.resolve("src/lib/debug/routes.ts")).href;

test("debug routes are undefined in production mode", async () => {
  const previous = process.env.NODE_ENV;
  const previousDebug = process.env.NEXT_PUBLIC_ENABLE_DEBUG;
  process.env.NODE_ENV = "production";
  process.env.NEXT_PUBLIC_ENABLE_DEBUG = "true";

  const { DEBUG_ENV_ROUTE, DEBUG_QA_ROUTE, DEBUG_DEMO_ROUTE } = await import(`${modulePath}?t=${Date.now()}`);

  assert.equal(DEBUG_ENV_ROUTE, undefined);
  assert.equal(DEBUG_QA_ROUTE, undefined);
  assert.equal(DEBUG_DEMO_ROUTE, undefined);

  process.env.NODE_ENV = previous;
  process.env.NEXT_PUBLIC_ENABLE_DEBUG = previousDebug;
});
