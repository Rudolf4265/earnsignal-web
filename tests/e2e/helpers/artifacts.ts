import { expect, type Page } from "@playwright/test";
import fs from "node:fs";

export async function downloadPdfFromUi(page: Page) {
  const downloadPromise = page.waitForEvent("download", { timeout: 60_000 });
  await page.getByRole("button", { name: /download pdf/i }).click();
  const download = await downloadPromise;
  return download.path();
}

export function assertDownloadedFileNonEmpty(filePath: string | null) {
  expect(filePath, "Playwright did not expose a downloaded PDF path").toBeTruthy();
  const stats = fs.statSync(filePath as string);
  expect(stats.size, "Downloaded PDF file is empty").toBeGreaterThan(0);
}
