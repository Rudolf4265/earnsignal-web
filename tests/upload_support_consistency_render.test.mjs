import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const dashboardPagePath = path.resolve("app/(app)/app/page.tsx");
const dataUploadPagePath = path.resolve("app/(app)/app/_components/upload/data-upload-page.tsx");
const helpPagePath = path.resolve("app/(app)/app/help/page.tsx");
const dashboardOnboardingPath = path.resolve("app/(app)/app/_components/dashboard/DashboardOnboardingSection.tsx");
const creatorHealthPanelPath = path.resolve("app/(app)/app/_components/dashboard/CreatorHealthPanel.tsx");
const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");
const supportSurfacePath = path.resolve("src/lib/upload/support-surface.ts");

test("launch support surfaces keep supported upload wording aligned across dashboard and help views", async () => {
  const [dashboardPage, dataUploadPage, helpPage, dashboardOnboarding, creatorHealthPanel, uploadStepper, supportSurface] = await Promise.all([
    readFile(dashboardPagePath, "utf8"),
    readFile(dataUploadPagePath, "utf8"),
    readFile(helpPagePath, "utf8"),
    readFile(dashboardOnboardingPath, "utf8"),
    readFile(creatorHealthPanelPath, "utf8"),
    readFile(uploadStepperPath, "utf8"),
    readFile(supportSurfacePath, "utf8"),
  ]);

  assert.equal(dashboardPage.includes("Add a fresh supported upload when you want to refresh the workspace."), true);
  assert.equal(dashboardPage.includes("Upload a supported file to populate Earn."), true);
  assert.equal(dataUploadPage.includes("Choose your platform and upload a supported file to generate your report."), true);
  assert.equal(helpPage.includes("Upload a supported file, let EarnSigma validate it, then review the dashboard and latest report once the workspace is ready."), true);
  assert.equal(dashboardOnboarding.includes("Start with a supported upload."), true);
  assert.equal(dashboardOnboarding.includes("Upload a supported file from your creator revenue workflow."), true);
  assert.equal(creatorHealthPanel.includes("Upload a supported file and run a report to unlock a measured health baseline."), true);
  assert.equal(dataUploadPage.includes("Supported platforms: {supportedRevenueUploads}."), true);
  assert.equal(dataUploadPage.includes("Patreon and Substack: native CSV export."), true);
  assert.equal(dataUploadPage.includes("YouTube: native analytics CSV or supported Takeout ZIP."), true);
  assert.equal(dataUploadPage.includes("Instagram and TikTok: allowlisted ZIP export only."), true);
  assert.equal(uploadStepper.includes("Patreon, Substack"), true);
  assert.equal(uploadStepper.includes("YouTube"), true);
  assert.equal(uploadStepper.includes("Instagram, TikTok"), true);
  assert.equal(uploadStepper.includes("Native CSV"), true);
  assert.equal(uploadStepper.includes("Analytics CSV or Takeout ZIP"), true);
  assert.equal(uploadStepper.includes("Allowlisted ZIP only"), true);
  assert.equal(uploadStepper.includes("Coming soon"), false);
  assert.equal(helpPage.includes("EarnSigma accepts only specific allowlisted ZIP formats. Not every ZIP from a platform will work."), true);
  assert.equal(helpPage.includes("Generic ZIP uploads and arbitrary archive parsing."), true);
  assert.equal(
    supportSurface.includes("allowlisted ZIP exports only."),
    true,
  );
  assert.equal(
    supportSurface.includes("Not every CSV or ZIP from a platform will work."),
    true,
  );
  assert.equal(helpPage.includes("Upload a supported CSV"), false);
  assert.equal(dashboardOnboarding.includes("supported CSV upload"), false);
});
