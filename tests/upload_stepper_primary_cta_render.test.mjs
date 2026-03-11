import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

test("upload stepper keeps Upload & Validate as primary CTA with ready-only emphasis", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes("const uploadReady = Boolean(platform && file) && !busy && !entitlementState.loading && entitlementState.canGenerateReport;"), true);
  assert.equal(source.includes("const reportAccessBlocked = !entitlementState.loading && !entitlementState.canGenerateReport;"), true);
  assert.equal(source.includes("disabled={!uploadReady}"), true);
  assert.equal(source.includes("Checking access..."), true);
  assert.equal(source.includes("shadow-[0_0_0_3px_rgba(16,185,129,0.18)]"), true);
  assert.equal(source.includes(': "border-transparent bg-brand-blue hover:bg-brand-blue/90"'), true);
});
