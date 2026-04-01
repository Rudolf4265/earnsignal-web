import { expect, test } from "@playwright/test";
import { stubAuthenticatedSession, stubEntitlements } from "./test-helpers";

test.describe("Help onboarding page", () => {
  test.beforeEach(async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubEntitlements(page, "entitled");
  });

  test("renders compact platform cards and opens the correct drawer content", async ({ page }) => {
    await page.goto("/app/help", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("help-page-hero")).toBeVisible();
    await expect(page.getByTestId("help-platform-grid")).toBeVisible();

    await expect(page.getByTestId("help-platform-card-patreon")).toContainText("Patreon");
    await expect(page.getByTestId("help-platform-card-patreon")).toContainText("Use the EarnSigma CSV template.");
    await expect(page.getByTestId("help-platform-card-patreon-primary")).toHaveText("Download Patreon template");

    await expect(page.getByTestId("help-platform-card-substack")).toContainText("Substack");
    await expect(page.getByTestId("help-platform-card-youtube-primary")).toHaveText("Upload YouTube export");
    await expect(page.getByTestId("help-platform-card-tiktok")).toContainText("Upload Overview, Viewers, or Followers export.");
    await expect(page.getByTestId("help-platform-card-instagram")).toContainText("Upload your Instagram export.");

    await page.getByTestId("help-platform-card-youtube-guide").click();

    await expect(page.getByTestId("platform-help-drawer")).toBeVisible();
    await expect(page.getByTestId("platform-help-drawer-youtube-title")).toHaveText("How to export your YouTube file");
    await expect(page.getByTestId("platform-help-drawer-accepted")).toContainText("Table data.csv");
    await expect(page.getByTestId("platform-help-drawer-accepted")).toContainText("Takeout not supported");
    await expect(page.getByTestId("platform-help-drawer-youtube-primary")).toHaveText("Upload YouTube export");
    await expect(page.getByTestId("platform-help-drawer-youtube-secondary")).toHaveText("Back");

    const beforeUploadToggle = page.getByTestId("platform-help-drawer-youtube-before-upload-toggle");
    const beforeUploadPanel = page.getByTestId("platform-help-drawer-youtube-before-upload-panel");
    await expect(beforeUploadToggle).toHaveAttribute("aria-expanded", "false");
    await beforeUploadToggle.dispatchEvent("click");
    await expect(beforeUploadToggle).toHaveAttribute("aria-expanded", "true");
    await expect(beforeUploadPanel).toContainText("Do not use Takeout");

    const commonMistakesToggle = page.getByTestId("platform-help-drawer-youtube-common-mistakes-toggle");
    const commonMistakesPanel = page.getByTestId("platform-help-drawer-youtube-common-mistakes-panel");
    await commonMistakesToggle.dispatchEvent("click");
    await expect(commonMistakesToggle).toHaveAttribute("aria-expanded", "true");
    await expect(commonMistakesPanel).toContainText("Using Google Takeout");

    await page.getByTestId("platform-help-drawer-youtube-secondary").dispatchEvent("click");
    await expect(page.getByTestId("platform-help-drawer")).toHaveCount(0);
  });

  test("drawer closes on escape and click-outside, and TikTok wording stays precise", async ({ page }) => {
    await page.goto("/app/help", { waitUntil: "domcontentloaded" });

    await page.getByTestId("help-platform-card-tiktok-guide").click();
    await expect(page.getByTestId("platform-help-drawer-tiktok-title")).toHaveText("How to export your TikTok file");
    await expect(page.getByTestId("platform-help-drawer-accepted")).toContainText("Overview / Viewers / Followers only");
    await expect(page.getByTestId("platform-help-drawer-accepted")).toContainText("Content NOT supported");
    await expect(page.getByTestId("platform-help-drawer-tiktok-primary")).toHaveText("Upload TikTok export");
    await expect(page.getByTestId("platform-help-drawer-tiktok-secondary")).toHaveText("Back");

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("platform-help-drawer")).toHaveCount(0);

    await page.getByTestId("help-platform-card-patreon-guide").click();
    await expect(page.getByTestId("platform-help-drawer-patreon-title")).toHaveText("How to prepare your Patreon file");
    await page.getByTestId("platform-help-drawer-backdrop").dispatchEvent("click");
    await expect(page.getByTestId("platform-help-drawer")).toHaveCount(0);
  });
});
