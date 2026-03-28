import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");
const progressStepperPath = path.resolve("app/(app)/app/_components/upload/Stepper.tsx");

test("upload stepper keeps Upload & Validate as the primary file-step CTA", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes("entitlementState.canUpload &&"), true);
  assert.equal(source.includes("entitlementState.canValidateUpload;"), true);
  assert.equal(source.includes("const reportAccessBlocked = !entitlementState.loading && !entitlementState.canGenerateReport;"), true);
  assert.equal(source.includes('data-testid="upload-file-guide"'), true);
  assert.equal(source.includes("Accepted format: {selectedPlatformCard?.acceptedFileTypesLabel"), true);
  assert.equal(source.includes("/app/help#upload-guide"), true);
  assert.equal(source.includes("disabled={!uploadReady}"), true);
  assert.equal(source.includes("Checking access..."), true);
  assert.equal(source.includes("Upload & Validate"), true);
});

test("upload progress stepper keeps explicit active, complete, and upcoming styling", async () => {
  const source = await readFile(progressStepperPath, "utf8");

  assert.equal(source.includes('bg-[linear-gradient(145deg,rgba(7,17,37,0.98),rgba(12,27,53,0.98),rgba(10,24,50,0.98))]'), true);
  assert.equal(source.includes("bg-gradient-to-r from-emerald-300/70 to-blue-300/70"), true);
  assert.equal(source.includes('complete ? "\\u2713" : index + 1'), true);
  assert.equal(source.includes('active ? "text-white" : complete ? "text-slate-200" : "text-slate-400"'), true);
});
