import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");
const progressStepperPath = path.resolve("app/(app)/app/_components/upload/Stepper.tsx");

test("upload stepper keeps Upload & Validate as primary CTA with ready-only emphasis", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes("entitlementState.canUpload &&"), true);
  assert.equal(source.includes("entitlementState.canValidateUpload;"), true);
  assert.equal(source.includes("const reportAccessBlocked = !entitlementState.loading && !entitlementState.canGenerateReport;"), true);
  assert.equal(source.includes('data-testid="upload-file-guide"'), true);
  assert.equal(source.includes("Accepted file type: CSV."), true);
  assert.equal(source.includes("/app/help#after-upload"), true);
  assert.equal(source.includes("disabled={!uploadReady}"), true);
  assert.equal(source.includes("Checking access..."), true);
  assert.equal(source.includes("shadow-[0_0_0_3px_rgba(16,185,129,0.18)]"), true);
  assert.equal(source.includes(': "border-transparent bg-brand-blue hover:bg-brand-blue/90"'), true);
});

test("upload progress stepper uses clearer active, complete, and upcoming styling", async () => {
  const source = await readFile(progressStepperPath, "utf8");

  assert.equal(source.includes('bg-[linear-gradient(145deg,rgba(7,17,37,0.98),rgba(12,27,53,0.98),rgba(10,24,50,0.98))]'), true);
  assert.equal(source.includes("bg-gradient-to-r from-emerald-300/70 to-blue-300/70"), true);
  assert.equal(source.includes('complete ? "\\u2713" : index + 1'), true);
  assert.equal(source.includes('active ? "text-white" : complete ? "text-slate-200" : "text-slate-400"'), true);
  assert.equal(source.includes("border-blue-200 bg-white text-slate-950 shadow-[0_0_0_4px_rgba(96,165,250,0.18)]"), true);
  assert.equal(source.includes("border-white/12 bg-white/[0.04] text-slate-400"), true);
});
