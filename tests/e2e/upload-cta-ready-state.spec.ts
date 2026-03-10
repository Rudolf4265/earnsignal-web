import { expect, test } from "@playwright/test";
import { stubAuthenticatedSession, stubEntitlements } from "./test-helpers";

test.describe("Upload CTA ready state", () => {
  test.beforeEach(async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubEntitlements(page, "entitled");
  });

  test("Upload & Validate is disabled by default and gains ready emphasis only when enabled", async ({ page }) => {
    await page.goto("/app/data");
    await page.getByRole("button", { name: "Patreon" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    const uploadButton = page.getByRole("button", { name: "Upload & Validate" });
    await expect(uploadButton).toBeDisabled();
    await expect(uploadButton).not.toHaveClass(/shadow-\[0_0_0_3px_rgba\(16,185,129,0\.18\)\]/);

    await page.locator('input[type="file"]').setInputFiles({
      name: "sample.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("email,revenue\na@example.com,123\n"),
    });

    await expect(uploadButton).toBeEnabled();
    await expect(uploadButton).toHaveClass(/shadow-\[0_0_0_3px_rgba\(16,185,129,0\.18\)\]/);
  });
});
