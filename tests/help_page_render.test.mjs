import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const helpPagePath = path.resolve("app/(app)/app/help/page.tsx");
const helpSurfacePath = path.resolve("app/(app)/app/help/_components/HelpOnboardingSurface.tsx");
const helpDrawerPath = path.resolve("app/(app)/app/help/_components/PlatformHelpDrawer.tsx");
const helpCardPath = path.resolve("app/(app)/app/help/_components/PlatformCard.tsx");
const helpContentPath = path.resolve("app/(app)/app/help/_components/help-platform-content.ts");
const troubleshootingPagePath = path.resolve("app/(app)/app/help/troubleshooting/page.tsx");
const dataUploadPagePath = path.resolve("app/(app)/app/_components/upload/data-upload-page.tsx");

test("help page is manifest-backed and delegates to the compact onboarding surface", async () => {
  const source = await readFile(helpPagePath, "utf8");

  assert.equal(source.includes("formatGuidanceLabelList"), true);
  assert.equal(source.includes("getStaticVisibleUploadPlatformCards"), true);
  assert.equal(source.includes("buildHelpPlatformContent"), true);
  assert.equal(source.includes("<HelpOnboardingSurface"), true);
  assert.equal(source.includes("reportDrivingSummary"), true);
  assert.equal(source.includes("supportingSummary"), true);
  assert.equal(source.includes("Quick help for first uploads"), false);
});

test("help onboarding surface trims redundant copy and removes the after-upload layout blocks", async () => {
  const source = await readFile(helpSurfacePath, "utf8");

  assert.equal(source.includes('data-testid="help-page-shell"'), true);
  assert.equal(source.includes('data-testid="help-page-hero"'), true);
  assert.equal(source.includes('data-testid="help-page-upload-guide"'), true);
  assert.equal(source.includes('data-testid="help-platform-grid"'), true);
  assert.equal(source.includes('data-testid="help-page-after-upload"'), false);
  assert.equal(source.includes('id="upload-guide"'), true);
  assert.equal(source.includes('id="after-upload"'), true);
  assert.equal(source.includes("Get the right file fast."), true);
  assert.equal(source.includes("Detailed guidance stays in the drawer"), false);
  assert.equal(source.includes("No long inline docs."), false);
  assert.equal(source.includes("Native Export = the original platform export format."), true);
  assert.equal(source.includes("Open upload flow"), false);
  assert.equal(source.includes("After upload"), false);
  assert.equal(source.includes("Scope limits"), false);
  assert.equal(source.includes("PlatformCard"), true);
  assert.equal(source.includes("PlatformHelpDrawer"), true);
  assert.equal(source.includes('href="/app/data"'), false);
  assert.equal(source.includes('href="/app/dashboard"'), true);
});

test("platform cards make the guide CTA primary while keeping drawer behavior intact", async () => {
  const [cardSource, drawerSource] = await Promise.all([
    readFile(helpCardPath, "utf8"),
    readFile(helpDrawerPath, "utf8"),
  ]);

  assert.equal(cardSource.includes("How to get your file"), true);
  assert.equal(cardSource.includes('data-testid={`${cardTestId}-guide`}'), true);
  assert.equal(cardSource.includes('testId={`${cardTestId}-secondary`}'), true);
  assert.equal(cardSource.includes("secondaryAction?: HelpPlatformAction | null;"), true);
  assert.equal(cardSource.includes("summary: string;"), false);
  assert.equal(cardSource.includes("hover:-translate-y-0.5"), true);
  assert.equal(cardSource.includes("buttonClassName"), true);

  assert.equal(drawerSource.includes('role="dialog"'), true);
  assert.equal(drawerSource.includes('aria-modal="true"'), true);
  assert.equal(drawerSource.includes("FOCUSABLE_SELECTOR"), true);
  assert.equal(drawerSource.includes('data-testid="platform-help-drawer"'), true);
  assert.equal(drawerSource.includes("Accepted file"), true);
  assert.equal(drawerSource.includes("Before you upload"), true);
  assert.equal(drawerSource.includes("Common mistakes"), true);
  assert.equal(drawerSource.includes("Overview / Viewers / Followers only"), false);
});

test("help platform content preserves platform truth and template/download actions", async () => {
  const source = await readFile(helpContentPath, "utf8");

  assert.equal(source.includes("Use the EarnSigma CSV template."), true);
  assert.equal(source.includes("Upload your YouTube Studio export."), true);
  assert.equal(source.includes("Upload Overview, Viewers, or Followers export."), true);
  assert.equal(source.includes("Upload your Instagram export."), true);
  assert.equal(source.includes("How to prepare your Patreon file"), true);
  assert.equal(source.includes("How to prepare your Substack file"), true);
  assert.equal(source.includes("How to export your YouTube file"), true);
  assert.equal(source.includes("How to export your TikTok file"), true);
  assert.equal(source.includes("How to export your Instagram file"), true);
  assert.equal(source.includes("CSV only"), true);
  assert.equal(source.includes("Takeout not supported. Also supported today: EarnSigma normalized CSV template."), true);
  assert.equal(source.includes("Overview / Viewers / Followers only"), true);
  assert.equal(source.includes("/templates/earnsigma-patreon-template.csv"), true);
  assert.equal(source.includes("/templates/earnsigma-substack-template.csv"), true);
  assert.equal(source.includes('label: "Upload CSV"'), true);
  assert.equal(source.includes('label: "Upload YouTube export"'), true);
  assert.equal(source.includes('label: "Upload TikTok export"'), true);
  assert.equal(source.includes('label: "Upload Instagram export"'), true);
  assert.equal(source.includes('label: "Back"'), true);
});

test("troubleshooting page exists at the correct route and contains required sections", async () => {
  const source = await readFile(troubleshootingPagePath, "utf8");

  assert.equal(source.includes('data-testid="troubleshooting-page-shell"'), true);
  assert.equal(source.includes('data-testid="troubleshooting-page-hero"'), true);
  // Section IDs are defined in the SECTIONS data array and applied dynamically via id={section.id}
  assert.equal(source.includes('"upload-failed"'), true);
  assert.equal(source.includes('"unsupported-formats"'), true);
  assert.equal(source.includes('"zip-issues"'), true);
  assert.equal(source.includes('"report-looks-wrong"'), true);
  assert.equal(source.includes('"no-data-detected"'), true);
  assert.equal(source.includes("Something not working?"), true);
  assert.equal(source.includes('href="/app/help"'), true);
  assert.equal(source.includes('href="/app/dashboard"'), true);
  // must NOT link back to onboarding in a way that loops
  assert.equal(source.includes('href="/app/help#after-upload"'), false);
});

test("troubleshooting page is distinct from the onboarding page", async () => {
  const [troubleshootingSource, onboardingSource] = await Promise.all([
    readFile(troubleshootingPagePath, "utf8"),
    readFile(helpSurfacePath, "utf8"),
  ]);

  // troubleshooting must not render the platform upload grid
  assert.equal(troubleshootingSource.includes("help-platform-grid"), false);
  assert.equal(troubleshootingSource.includes("HelpOnboardingSurface"), false);
  // onboarding must not include troubleshooting section ids
  assert.equal(onboardingSource.includes('id="upload-failed"'), false);
  assert.equal(onboardingSource.includes('id="zip-issues"'), false);
});

test("data upload page Troubleshooting card links to /app/help/troubleshooting not /app/help#after-upload", async () => {
  const source = await readFile(dataUploadPagePath, "utf8");

  assert.equal(source.includes('href="/app/help/troubleshooting"'), true,
    "Troubleshooting card must link to /app/help/troubleshooting");
  assert.equal(source.includes('href="/app/help#after-upload"'), false,
    "Troubleshooting card must NOT link to /app/help#after-upload");
  // upload guide link must remain unchanged
  assert.equal(source.includes('href="/app/help#upload-guide"'), true,
    "Upload guide card must still link to /app/help#upload-guide");
  // privacy link must remain unchanged
  assert.equal(source.includes('href="/data-privacy"'), true,
    "Privacy card must remain unchanged");
});
