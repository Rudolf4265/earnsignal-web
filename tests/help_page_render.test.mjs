import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const helpPagePath = path.resolve("app/(app)/app/help/page.tsx");
const helpSurfacePath = path.resolve("app/(app)/app/help/_components/HelpOnboardingSurface.tsx");
const helpDrawerPath = path.resolve("app/(app)/app/help/_components/PlatformHelpDrawer.tsx");
const helpCardPath = path.resolve("app/(app)/app/help/_components/PlatformCard.tsx");
const helpContentPath = path.resolve("app/(app)/app/help/_components/help-platform-content.ts");

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

test("help onboarding surface uses a compact card grid with preserved anchor targets", async () => {
  const source = await readFile(helpSurfacePath, "utf8");

  assert.equal(source.includes('data-testid="help-page-shell"'), true);
  assert.equal(source.includes('data-testid="help-page-hero"'), true);
  assert.equal(source.includes('data-testid="help-page-upload-guide"'), true);
  assert.equal(source.includes('data-testid="help-platform-grid"'), true);
  assert.equal(source.includes('data-testid="help-page-after-upload"'), true);
  assert.equal(source.includes('id="upload-guide"'), true);
  assert.equal(source.includes('id="after-upload"'), true);
  assert.equal(source.includes("Get the right file fast."), true);
  assert.equal(source.includes("Detailed guidance stays in the drawer"), true);
  assert.equal(source.includes("No long inline docs."), true);
  assert.equal(source.includes("PlatformCard"), true);
  assert.equal(source.includes("PlatformHelpDrawer"), true);
  assert.equal(source.includes('href="/app/data"'), true);
  assert.equal(source.includes('href="/app"'), true);
});

test("platform cards and drawer components expose the premium disclosure pattern", async () => {
  const [cardSource, drawerSource] = await Promise.all([
    readFile(helpCardPath, "utf8"),
    readFile(helpDrawerPath, "utf8"),
  ]);

  assert.equal(cardSource.includes("How to get your file"), true);
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

test("help platform content includes the exact platform-specific copy and CTA labels", async () => {
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
  assert.equal(source.includes("CSV only — use the EarnSigma template."), true);
  assert.equal(source.includes("Takeout not supported. Also supported today: EarnSigma normalized CSV template."), true);
  assert.equal(source.includes("Overview / Viewers / Followers only\\nContent NOT supported"), true);
  assert.equal(source.includes("/templates/earnsigma-patreon-template.csv"), true);
  assert.equal(source.includes("/templates/earnsigma-substack-template.csv"), true);
  assert.equal(source.includes('label: "Upload CSV"'), true);
  assert.equal(source.includes('label: "Back"'), true);
});
