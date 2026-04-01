import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const dashboardPagePath = path.resolve("app/(app)/app/page.tsx");
const dataUploadPagePath = path.resolve("app/(app)/app/_components/upload/data-upload-page.tsx");
const helpPagePath = path.resolve("app/(app)/app/help/page.tsx");
const helpSurfacePath = path.resolve("app/(app)/app/help/_components/HelpOnboardingSurface.tsx");
const dashboardOnboardingPath = path.resolve("app/(app)/app/_components/dashboard/DashboardOnboardingSection.tsx");
const creatorHealthPanelPath = path.resolve("app/(app)/app/_components/dashboard/CreatorHealthPanel.tsx");
const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");
const supportSurfacePath = path.resolve("src/lib/upload/support-surface.ts");

test("launch support surfaces align on workspace, combined report, and manifest-driven support truth", async () => {
  const [dashboardPage, dataUploadPage, helpPage, helpSurface, dashboardOnboarding, creatorHealthPanel, uploadStepper, supportSurface] = await Promise.all([
    readFile(dashboardPagePath, "utf8"),
    readFile(dataUploadPagePath, "utf8"),
    readFile(helpPagePath, "utf8"),
    readFile(helpSurfacePath, "utf8"),
    readFile(dashboardOnboardingPath, "utf8"),
    readFile(creatorHealthPanelPath, "utf8"),
    readFile(uploadStepperPath, "utf8"),
    readFile(supportSurfacePath, "utf8"),
  ]);

  assert.equal(dashboardPage.includes("Add a fresh supported upload when you want to refresh the workspace."), true);
  assert.equal(dataUploadPage.includes("This report uses your staged sources."), true);
  assert.equal(dataUploadPage.includes("Your data sources"), true);
  assert.equal(dataUploadPage.includes("Advanced details"), true);
  assert.equal(dataUploadPage.includes("Add source"), true);
  assert.equal(helpPage.includes("getStaticVisibleUploadPlatformCards"), true);
  assert.equal(helpPage.includes("buildHelpPlatformContent"), true);
  assert.equal(helpSurface.includes("Report-driving sources:"), true);
  assert.equal(helpSurface.includes("Upload completion stages a source in your workspace."), true);
  assert.equal(helpSurface.includes("Generic ZIP bundles, arbitrary exports, Stripe imports, and sponsorship automation"), true);
  assert.equal(dashboardOnboarding.includes("Start with a supported upload."), true);
  assert.equal(creatorHealthPanel.includes("Upload a supported file and run a report to unlock a measured health baseline."), true);
  assert.equal(uploadStepper.includes("Choose platform"), true);
  assert.equal(uploadStepper.includes("Your data stays private"), true);
  assert.equal(uploadStepper.includes("Source types"), false);
  assert.equal(uploadStepper.includes("Continue to file upload"), true);
  assert.equal(supportSurface.includes("buildVisibleUploadPlatformCardsFromSourceManifest"), true);
  assert.equal(supportSurface.includes("getStaticVisibleUploadPlatformCards"), true);
  assert.equal(supportSurface.includes("support-matrix"), false);
});
