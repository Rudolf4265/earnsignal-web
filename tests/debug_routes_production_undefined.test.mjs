import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const modulePath = pathToFileURL(path.resolve("src/lib/debug/routes.ts")).href;

test("debug routes are undefined in production mode", async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  const { DEBUG_ENV_ROUTE, DEBUG_QA_ROUTE } = await import(`${modulePath}?t=${Date.now()}`);

  assert.equal(DEBUG_ENV_ROUTE, undefined);
  assert.equal(DEBUG_QA_ROUTE, undefined);

  process.env.NODE_ENV = previous;
});
