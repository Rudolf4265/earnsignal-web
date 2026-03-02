import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

test("entitlements_error callout renders expected testid and CTAs", async () => {
  const source = await readFile(path.resolve("app/(app)/_components/gate-callouts.tsx"), "utf8");

  assert.equal(source.includes('data-testid="gate-entitlements-error"'), true);
  assert.equal(source.includes("Unable to verify subscription status."), true);
  assert.equal(source.includes("Retry"), true);
  assert.equal(source.includes("Go to Billing"), true);
});
