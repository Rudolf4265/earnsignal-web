import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

test("upload platform selector renders grouped section headers with shared support guidance", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes('data-testid="upload-platform-guide"'), true);
  assert.equal(source.includes("/app/help#upload-guide"), true);
  assert.equal(source.includes("platformSections.map((section) =>"), true);
  assert.equal(source.includes('data-testid={`platform-section-${section.category}`}'), true);
  assert.equal(source.includes("Choose platform"), true);
  assert.equal(source.includes("Select one supported platform to begin."), true);
  assert.equal(source.includes("visiblePlatformCards: UploadPlatformCardMetadata[];"), true);
  assert.equal(source.includes("supportedRevenueUploads: string;"), true);
  assert.equal(source.includes("const platformSections = useMemo(() => groupPlatformCards(visiblePlatformCards), [visiblePlatformCards]);"), true);
  assert.equal(source.includes("const showPlatformSectionHeading = platformSections.length > 1;"), true);
  assert.equal(source.includes("label={item.label}"), true);
  assert.equal(source.includes('testId={`platform-card-${item.id}`}'), true);
  assert.equal(source.includes("UPLOAD_PLATFORM_CARDS"), false);
  assert.equal(source.includes("getSupportedRevenueUploadSummary"), false);
  assert.equal(source.includes("supportedRevenueUploadFormats"), false);
});

test("upload platform file guidance stays truthful for normalized instagram and tiktok uploads", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes("Supported platforms: {supportedRevenueUploads}."), true);
  assert.equal(source.includes('bg-[linear-gradient(145deg,rgba(10,24,50,0.96),rgba(14,30,63,0.96),rgba(12,27,53,0.98))]'), true);
  assert.equal(source.includes('border-white/10 bg-white/[0.05]'), true);
  assert.equal(source.includes("Patreon, Substack, YouTube"), true);
  assert.equal(source.includes("Instagram Performance, TikTok Performance"), true);
  assert.equal(source.includes("CSV only"), true);
  assert.equal(source.includes("CSV or selected ZIP"), true);
  assert.equal(source.includes("ZIP reminder"), true);
  assert.equal(source.includes("Not all ZIP files are supported."), true);
  assert.equal(source.includes('selectedPlatformCard?.importMode === "normalized_csv"'), true);
  assert.equal(source.includes("Upload the template-based normalized CSV for this platform."), true);
  assert.equal(source.includes("Upload the template-based normalized CSV or a selected supported ZIP for this platform."), true);
  assert.equal(
    source.includes(
      "Accepted file types: CSV. Selected supported ZIP exports are also accepted for this platform. Not all ZIP files are supported. If a ZIP is rejected, upload a supported CSV instead. EarnSigma validates the file first, then keeps processing until a report is ready when your plan includes report generation.",
    ),
    true,
  );
  assert.equal(
    source.includes(
      "If validation fails, make sure you selected the matching platform and retry with the supported file format for this platform. If processing stalls, retry status before starting over.",
    ),
    true,
  );
  assert.equal(source.includes("Need help? Review the upload guide for the supported file type."), true);
  assert.equal(source.includes("description={item.subtitle}"), true);
  assert.equal(source.includes("fileTypeLabel={item.fileTypeLabel}"), true);
  assert.equal(source.includes("File type"), true);
  assert.equal(source.includes("Selected. Continue to file upload."), true);
  assert.equal(source.includes("Select platform to continue"), true);
  assert.equal(source.includes("Continue to file upload"), true);
  assert.equal(source.includes("full support for this export type is coming soon"), false);
  assert.equal(source.includes("selectedPlatformCard?.guidance"), true);
  assert.equal(source.includes('className="platform-icon block h-5 w-5 object-contain"'), true);
  assert.equal(source.includes("disabled={!available}"), true);
  assert.equal(source.includes("if (!item.available) return;"), true);
  assert.equal(source.includes("setPlatform(item.id);"), true);
  assert.equal(source.includes("Supported"), true);
  assert.equal(source.includes("Coming soon"), false);
  assert.equal(source.includes("Twitch"), false);
  assert.equal(source.includes("Snapchat"), false);
  assert.equal(source.includes("OnlyFans"), false);
  assert.equal(source.includes("COMING_SOON_CHIP_PLATFORMS"), false);
  assert.equal(source.includes("Ask your platform for a CSV export."), false);
});
