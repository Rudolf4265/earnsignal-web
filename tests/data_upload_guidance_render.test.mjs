import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const dataUploadPagePath = path.resolve("app/(app)/app/_components/upload/data-upload-page.tsx");
const trustMicrocopyPath = path.resolve("src/components/ui/trust-microcopy.tsx");
const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

test("data upload page adds truthful upload, mode, and help guidance", async () => {
  const [source, trustSource, uploadStepperSource] = await Promise.all([
    readFile(dataUploadPagePath, "utf8"),
    readFile(trustMicrocopyPath, "utf8"),
    readFile(uploadStepperPath, "utf8"),
  ]);

  assert.equal(source.includes('data-testid="data-upload-guide"'), true);
  assert.equal(source.includes("const FALLBACK_VISIBLE_UPLOAD_PLATFORM_CARDS = getFallbackVisibleUploadPlatformCards();"), true);
  assert.equal(source.includes("getUploadSupportMatrix()"), true);
  assert.equal(source.includes("buildVisibleUploadPlatformCardsFromSupportMatrix(supportMatrix)"), true);
  assert.equal(source.includes("getSupportedRevenueUploadFormatGuidanceFromCards(visiblePlatformCards)"), true);
  assert.equal(source.includes("Keep the current safe fallback support surface."), true);
  assert.equal(source.includes("<UploadStepper visiblePlatformCards={visiblePlatformCards} supportedRevenueUploads={supportedRevenueUploads} />"), true);
  assert.equal(source.includes("/app/help#upload-guide"), true);
  assert.equal(source.includes("Upload your data"), true);
  assert.equal(source.includes("Choose your platform and upload a supported file to generate your report."), true);
  assert.equal(source.includes("Validated uploads appear here once you complete a supported upload."), true);
  assert.equal(source.includes("supported CSV upload"), false);
  assert.equal(source.includes("Supported platforms: {supportedRevenueUploads}."), true);
  assert.equal(source.includes("{supportedRevenueUploadFormatGuidance}"), true);
  assert.equal(source.includes("Patreon, Substack, and YouTube are CSV only."), true);
  assert.equal(source.includes("Instagram Performance and TikTok Performance use template-based normalized CSV or selected supported ZIP."), true);
  assert.equal(source.includes("If a ZIP is rejected, upload a supported CSV instead."), true);
  assert.equal(source.includes("Step-by-step file prep, supported file guidance, and troubleshooting live in the upload guide."), true);
  assert.equal(uploadStepperSource.includes("<TrustMicrocopy"), true);
  assert.equal(uploadStepperSource.includes('testId="upload-trust-strip"'), true);
  assert.equal(uploadStepperSource.includes("UPLOAD_TRUST_MICROCOPY_BODY"), true);
  assert.equal(uploadStepperSource.includes('className="border-slate-300/90 bg-white"'), true);
  assert.equal(
    trustSource.includes(
      'UPLOAD_TRUST_MICROCOPY_BODY =\n  "Files are used only to generate your reports and operate the service. Never sold. Never used to train public AI models."',
    ),
    true,
  );
  assert.equal(trustSource.includes('TRUST_MICROCOPY_LINK_TEXT = "Learn how we handle your data"'), true);
  assert.equal(trustSource.includes("href={publicUrls.dataPrivacy}"), true);
  assert.equal(trustSource.includes(': "border-slate-300 bg-white text-slate-800 shadow-sm"'), true);
  assert.equal(trustSource.includes(': "leading-5 text-slate-700 sm:text-[0.82rem]"'), true);
  assert.equal(trustSource.includes(': "text-slate-800 underline underline-offset-4 hover:text-slate-950"'), true);
});
