import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

test("upload platform selector is manifest-driven and simplified for users", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes('data-testid="upload-platform-guide"'), true);
  assert.equal(source.includes("/app/help#upload-guide"), true);
  assert.equal(source.includes("sourceManifest: NormalizedSourceManifest;"), true);
  assert.equal(source.includes("visiblePlatformCards: UploadPlatformCardMetadata[];"), true);
  assert.equal(source.includes("platformSections.map((section) =>"), true);
  assert.equal(source.includes('data-testid={`platform-section-${section.category}`}'), true);
  assert.equal(source.includes("Choose platform"), true);
  assert.equal(source.includes("Select the source you want to upload."), true);
  assert.equal(source.includes("Need format rules? Open upload guide."), true);
  assert.equal(source.includes("Source types"), false);
  assert.equal(source.includes("getPlatformRoleBadgeLabel"), false);
  assert.equal(source.includes("getPlatformRoleDetail"), false);
  assert.equal(source.includes("UPLOAD_PLATFORM_CARDS"), false);
});

test("upload file step uses manifest card guidance without source-taxonomy copy", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes('title="Before you upload"'), true);
  assert.equal(source.includes("selectedPlatformCard.contributionLabel"), true);
  assert.equal(source.includes("selectedPlatformCard?.acceptedFileTypesLabel"), true);
  assert.equal(source.includes("selectedPlatformCard?.guidance"), false);
  assert.equal(source.includes("selectedPlatformCard?.roleSummary"), false);
  assert.equal(source.includes("Exact file rules, ZIP requirements, and troubleshooting live in the Upload Guide."), true);
  assert.equal(source.includes("Exact file rules are in Upload Guide."), true);
  assert.equal(source.includes("getPlatformRoleDetail(selectedPlatformCard.platformRole)"), false);
  assert.equal(source.includes("selectedPlatformCard?.importMode"), false);
  assert.equal(source.includes("supportedRevenueUploads"), false);
});
