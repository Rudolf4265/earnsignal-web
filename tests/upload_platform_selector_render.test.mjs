import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

test("upload platform selector is manifest-driven and keeps the canonical workspace guide visible", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes('data-testid="upload-platform-guide"'), true);
  assert.equal(source.includes("/app/help#upload-guide"), true);
  assert.equal(source.includes("sourceManifest: NormalizedSourceManifest;"), true);
  assert.equal(source.includes("visiblePlatformCards: UploadPlatformCardMetadata[];"), true);
  assert.equal(source.includes("platformSections.map((section) =>"), true);
  assert.equal(source.includes('data-testid={`platform-section-${section.category}`}'), true);
  assert.equal(source.includes("Source types"), true);
  assert.equal(source.includes("Choose what to add next. Exact file rules stay in the Upload Guide."), true);
  assert.equal(source.includes('getPlatformRoleBadgeLabel("report-driving")'), true);
  assert.equal(source.includes('getPlatformRoleDetail("supporting")'), true);
  assert.equal(source.includes("Current primary sources:"), false);
  assert.equal(source.includes("Current supporting sources:"), false);
  assert.equal(source.includes("UPLOAD_PLATFORM_CARDS"), false);
});

test("upload file step uses manifest card guidance rather than import-mode branches", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes('title="Before you upload"'), true);
  assert.equal(source.includes("selectedPlatformCard.contributionLabel"), true);
  assert.equal(source.includes("selectedPlatformCard?.acceptedFileTypesLabel"), true);
  assert.equal(source.includes("selectedPlatformCard?.guidance"), false);
  assert.equal(source.includes("selectedPlatformCard?.roleSummary"), false);
  assert.equal(source.includes("Exact file rules, ZIP requirements, and troubleshooting live in the Upload Guide."), true);
  assert.equal(source.includes("Need help? Review the upload guide for the supported file type."), false);
  assert.equal(source.includes("Exact file rules are in Upload Guide."), true);
  assert.equal(source.includes("selectedPlatformCard?.importMode"), false);
  assert.equal(source.includes("supportedRevenueUploads"), false);
});
