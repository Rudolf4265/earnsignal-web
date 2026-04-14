import { expect, type Page } from "@playwright/test";
import { runReportButton, selectors, sourceRow } from "./selectors";

export async function gotoWorkspace(page: Page) {
  await page.goto("/app/data", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: selectors.dataPageHeading })).toBeVisible({ timeout: 30_000 });
}

export async function uploadSourceFile(page: Page, sourceName: string, filePath: string) {
  await page.getByTestId(`platform-card-${sourceName.toLowerCase()}`).click();
  await page.getByRole("button", { name: /continue to file upload/i }).click();
  await page.locator('input[type="file"]').setInputFiles(filePath);
  await page.getByRole("button", { name: /upload & validate/i }).click();
}

export async function waitForSourceReady(page: Page, sourceName: string) {
  const platform = sourceName.toLowerCase();
  await expect(sourceRow(page, platform)).toBeVisible({ timeout: 90_000 });
  await expect(sourceRow(page, platform)).toContainText(/Ready|Connected/i, { timeout: 90_000 });
}

export async function assertRunReportDisabled(page: Page) {
  await expect(runReportButton(page)).toBeDisabled();
}

export async function assertRunReportEnabled(page: Page) {
  await expect(runReportButton(page)).toBeEnabled({ timeout: 30_000 });
}

export async function addAnotherSource(page: Page) {
  const addAnother = page.getByRole("button", { name: /add another source/i }).first();
  if (await addAnother.isVisible().catch(() => false)) {
    await addAnother.click();
    return;
  }

  await page.getByRole("button", { name: /^add source$/i }).click();
}
