import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const helpPagePath = path.resolve("app/(app)/app/help/page.tsx");

test("help page renders workspace-based onboarding guidance with manifest-driven support limits", async () => {
  const source = await readFile(helpPagePath, "utf8");

  assert.equal(source.includes('data-testid="help-page-hero"'), true);
  assert.equal(source.includes('data-testid="help-page-how-it-works"'), true);
  assert.equal(source.includes('data-testid="help-page-mode-guide"'), true);
  assert.equal(source.includes('data-testid="help-page-upload-guide"'), true);
  assert.equal(source.includes('data-testid="help-page-file-prep"'), true);
  assert.equal(source.includes('data-testid="help-page-after-upload"'), true);
  assert.equal(source.includes('data-testid="help-page-faq"'), true);
  assert.equal(source.includes('data-testid="help-page-troubleshooting"'), true);
  assert.equal(source.includes('data-testid="help-page-not-supported"'), true);
  assert.equal(source.includes("getStaticSourceManifestSnapshot"), true);
  assert.equal(source.includes("getStaticVisibleUploadPlatformCards"), true);
  assert.equal(source.includes("getSupportedRevenueUploadFormatGuidanceFromCards"), true);
  assert.equal(source.includes("Quick help for first uploads"), true);
  assert.equal(source.includes("Quick orientation"), true);
  assert.equal(source.includes("Supported imports"), true);
  assert.equal(source.includes("How to prepare your files"), true);
  assert.equal(source.includes("Frequently asked questions"), true);
  assert.equal(source.includes("Common upload problems"), true);
  assert.equal(source.includes("What is not supported yet"), true);
  assert.equal(source.includes("Currently supported uploads are {supportedRevenueUploads}."), true);
  assert.equal(source.includes("{supportedRevenueUploadFormatGuidance}"), true);
  assert.equal(source.includes("sourceManifest.eligibilityRule"), true);
  assert.equal(source.includes("sourceManifest.businessMetricsRule"), true);
  assert.equal(source.includes("Upload supported files, let EarnSigma validate and stage them, then run one combined report when your workspace is ready."), true);
  assert.equal(source.includes("After upload, validation and ingestion run first."), true);
  assert.equal(source.includes("Trust copy such as coverage notes, business-metrics strength, and section-level limitations comes from the report payload itself."), true);
  assert.equal(source.includes("supportedUploadCards.filter((card) => card.platformRole === \"report-driving\")"), true);
  assert.equal(source.includes("supportedUploadCards.filter((card) => card.platformRole === \"supporting\")"), true);
  assert.equal(source.includes("Does EarnSigma support Stripe uploads?"), true);
  assert.equal(source.includes("Does EarnSigma support sponsorship or brand-deal imports?"), true);
  assert.equal(source.includes("Generic ZIP uploads and arbitrary archive parsing."), true);
  assert.equal(source.includes("Stripe self-serve imports."), true);
  assert.equal(source.includes("Sponsorship or brand-deal automation."), true);
  assert.equal(source.includes('href="/app/data"'), true);
  assert.equal(source.includes('href="/app"'), true);
});
