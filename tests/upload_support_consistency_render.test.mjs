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

test("launch support surfaces align on workspace, combined report, and manifest-driven support truth", async () => {
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
  assert.equal(dataUploadPage.includes("Stage creator data, then run one combined decision-ready report from the current workspace snapshot."), true);
  assert.equal(dataUploadPage.includes("Your data sources"), true);
  assert.equal(dataUploadPage.includes("Build your report"), true);
  assert.equal(helpPage.includes("Upload supported files, let EarnSigma validate and stage them, then run one combined report when your workspace is ready."), true);
  assert.equal(dashboardOnboarding.includes("Start with a supported upload."), true);
  assert.equal(creatorHealthPanel.includes("Upload a supported file and run a report to unlock a measured health baseline."), true);
  assert.equal(uploadStepper.includes("Workspace sources"), true);
  assert.equal(uploadStepper.includes("sourceManifest.eligibilityRule"), true);
  assert.equal(supportSurface.includes("buildVisibleUploadPlatformCardsFromSourceManifest"), true);
  assert.equal(supportSurface.includes("getStaticVisibleUploadPlatformCards"), true);
  assert.equal(supportSurface.includes("support-matrix"), false);
});
