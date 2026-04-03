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
  assert.equal(source.includes("selectedPlatformCard.label} | ${selectedPlatformCard.acceptedFileTypesLabel"), true);
  assert.equal(source.includes("/app/help#upload-guide"), true);
  assert.equal(source.includes('data-testid="upload-drop-zone"'), true);
  assert.equal(source.includes("disabled={!uploadReady}"), true);
  assert.equal(source.includes("Checking access..."), true);
  assert.equal(source.includes("Upload & Validate"), true);
});

test("upload platform step uses a sticky primary footer CTA", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes("UploadPrimaryFooterBar"), true);
  assert.equal(source.includes('data-testid="upload-primary-footer-bar"'), true);
  assert.equal(source.includes("sticky bottom-0"), true);
  assert.equal(source.includes("Continue to file upload"), true);
  assert.equal(source.includes("bg-emerald-400 text-slate-950 shadow-[0_0_28px_-10px_rgba(52,211,153,0.95)] hover:bg-emerald-300"), true);
  assert.equal(source.includes("bg-brand-blue text-white shadow-[0_0_28px_-10px_rgba(59,130,246,0.95)] hover:bg-brand-blue/90"), false);
  assert.equal(source.includes("Step 1 of 5"), true);
  assert.equal(source.includes("Source types"), false);
});

test("upload progress stepper keeps explicit active, complete, and upcoming styling", async () => {
  const source = await readFile(progressStepperPath, "utf8");

  assert.equal(source.includes('rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4'), true);
  assert.equal(source.includes("bg-emerald-500/15 text-emerald-300 ring-emerald-400/25"), true);
  assert.equal(source.includes("bg-blue-500/15 text-blue-200 ring-blue-400/30"), true);
  assert.equal(source.includes("index + 1"), true);
});
