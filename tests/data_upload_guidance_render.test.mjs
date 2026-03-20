import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const dataUploadPagePath = path.resolve("app/(app)/app/_components/upload/data-upload-page.tsx");

test("data upload page adds truthful upload, mode, and help guidance", async () => {
  const source = await readFile(dataUploadPagePath, "utf8");

  assert.equal(source.includes('data-testid="data-upload-guide"'), true);
  assert.equal(source.includes('data-testid="upload-trust-strip"'), true);
  assert.equal(source.includes("const FALLBACK_VISIBLE_UPLOAD_PLATFORM_CARDS = getFallbackVisibleUploadPlatformCards();"), true);
  assert.equal(source.includes("getUploadSupportMatrix()"), true);
  assert.equal(source.includes("buildVisibleUploadPlatformCardsFromSupportMatrix(supportMatrix)"), true);
  assert.equal(source.includes("getSupportedRevenueUploadFormatGuidanceFromCards(visiblePlatformCards)"), true);
  assert.equal(source.includes("Keep the current safe fallback support surface."), true);
  assert.equal(source.includes("<UploadStepper visiblePlatformCards={visiblePlatformCards} supportedRevenueUploads={supportedRevenueUploads} />"), true);
  assert.equal(source.includes("/app/help#upload-guide"), true);
  assert.equal(source.includes("Your data stays private"), true);
  assert.equal(source.includes("Files are used only to generate your reports and operate the service. Never sold. Never used to train public AI models."), true);
  assert.equal(source.includes("Learn how we handle your data"), true);
  assert.equal(source.includes("publicUrls.dataPrivacy"), true);
  assert.equal(source.includes("Current public upload options: {supportedRevenueUploads}."), true);
  assert.equal(source.includes("{supportedRevenueUploadFormatGuidance}"), true);
});
