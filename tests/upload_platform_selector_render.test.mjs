import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

test("upload platform selector renders grouped section headers with shared support guidance", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes('data-testid="upload-platform-guide"'), true);
  assert.equal(source.includes("/app/help#upload-guide"), true);
  assert.equal(source.includes("getSupportedRevenueUploadFormatGuidanceFromCards(visiblePlatformCards)"), true);
  assert.equal(source.includes("platformSections.map((section) =>"), true);
  assert.equal(source.includes('data-testid={`platform-section-${section.category}`}'), true);
  assert.equal(source.includes("Choose platform"), true);
  assert.equal(source.includes("Select the data source for this upload."), true);
  assert.equal(source.includes("visiblePlatformCards: UploadPlatformCardMetadata[];"), true);
  assert.equal(source.includes("supportedRevenueUploads: string;"), true);
  assert.equal(source.includes("const platformSections = useMemo(() => groupPlatformCards(visiblePlatformCards), [visiblePlatformCards]);"), true);
  assert.equal(source.includes("UPLOAD_PLATFORM_CARDS"), false);
  assert.equal(source.includes("getSupportedRevenueUploadSummary"), false);
});

test("upload platform file guidance stays truthful for normalized instagram and tiktok uploads", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes("Upload accepts {supportedRevenueUploads}"), true);
  assert.equal(source.includes("{supportedRevenueUploadFormats}"), true);
  assert.equal(source.includes("Start with a supported import"), true);
  assert.equal(source.includes("fresh supported import"), true);
  assert.equal(source.includes('selectedPlatformCard?.importMode === "normalized_csv"'), true);
  assert.equal(source.includes("Upload the supported normalized CSV for this platform."), true);
  assert.equal(source.includes("If validation fails, retry with the supported file format for this platform."), true);
  assert.equal(source.includes("full support for this export type is coming soon"), false);
  assert.equal(source.includes("selectedPlatformCard?.guidance"), true);
  assert.equal(source.includes('className="platform-icon block h-5 w-5 object-contain"'), true);
  assert.equal(source.includes("disabled={!available}"), true);
  assert.equal(source.includes("if (!item.available) return;"), true);
  assert.equal(source.includes("setPlatform(item.id);"), true);
  assert.equal(source.includes("Supported"), true);
  assert.equal(source.includes("Coming soon"), true);
  assert.equal(source.includes("Ask your platform for a CSV export."), false);
});
