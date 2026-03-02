import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("FeatureGuard redirect branch renders deterministic terminal UI (no loading shell)", async () => {
  const source = await readFile("app/(app)/_components/feature-guard.tsx", "utf8");

  assert.equal(source.includes('case "redirect":'), true);
  assert.equal(source.includes("return <NotEntitledCallout />;"), true);

  const redirectCase = source.split('case "redirect":')[1]?.split("default:")[0] ?? "";
  assert.equal(redirectCase.includes("gate-loading"), false);
  assert.equal(redirectCase.includes("GateLoadingShell"), false);
});
