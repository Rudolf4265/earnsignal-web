import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const helpPagePath = path.resolve("app/(app)/app/help/page.tsx");

test("help page renders self-service onboarding guidance with explicit support limits", async () => {
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
  assert.equal(source.includes("getSupportedRevenueUploadFormatGuidance"), true);
  assert.equal(source.includes("Quick help for first uploads"), true);
  assert.equal(source.includes("Quick orientation"), true);
  assert.equal(source.includes("Supported imports"), true);
  assert.equal(source.includes("How to prepare your files"), true);
  assert.equal(source.includes("Frequently asked questions"), true);
  assert.equal(source.includes("Common upload problems"), true);
  assert.equal(source.includes("What is not supported yet"), true);
  assert.equal(source.includes("Currently supported uploads are {supportedRevenueUploads}."), true);
  assert.equal(source.includes("{supportedRevenueUploadFormatGuidance}"), true);
  assert.equal(source.includes("Upload a supported file, let EarnSigma validate it, then review the dashboard and latest report once the workspace is ready."), true);
  assert.equal(source.includes("After upload, validation runs first."), true);
  assert.equal(source.includes("Selected supported ZIP exports are accepted only for Instagram Performance and TikTok Performance."), true);
  assert.equal(source.includes("Not all ZIP files are supported. Unsupported ZIP files will be rejected. If a ZIP is rejected, use a supported CSV instead."), true);
  assert.equal(source.includes('question: "How do I upload Instagram Performance data?"'), true);
  assert.equal(source.includes('question: "How do I upload TikTok Performance data?"'), true);
  assert.equal(source.includes('question: "Does EarnSigma support Stripe uploads?"'), true);
  assert.equal(source.includes('question: "Does EarnSigma support sponsorship or brand-deal imports?"'), true);
  assert.equal(source.includes("Generic ZIP uploads and arbitrary archive parsing."), true);
  assert.equal(source.includes("Stripe self-serve imports."), true);
  assert.equal(source.includes("Sponsorship or brand-deal automation."), true);
  assert.equal(source.includes("Upload a supported CSV"), false);
  assert.equal(source.includes("upload any ZIP"), false);
  assert.equal(source.includes("supports all major creator platforms"), false);
  assert.equal(source.includes("Richer scorecards appear when supported analytics are available."), true);
  assert.equal(source.includes("Instagram uploads"), false);
  assert.equal(source.includes("TikTok uploads"), false);
  assert.equal(source.includes('href="/app/data"'), true);
  assert.equal(source.includes('href="/app"'), true);
});
