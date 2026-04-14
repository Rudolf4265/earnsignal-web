import { expect, type Page } from "@playwright/test";
import { reportDetail, reportList, runReportButton } from "./selectors";

export async function triggerRunReport(page: Page) {
  await runReportButton(page).click();
  const dialog = page.getByTestId("analysis-window-dialog");
  if (await dialog.isVisible().catch(() => false)) {
    await page.getByTestId("analysis-window-latest").click();
  }
}

export async function openLatestReportFromList(page: Page) {
  await page.goto("/app/report", { waitUntil: "domcontentloaded" });
  await expect(reportList(page)).toBeVisible({ timeout: 60_000 });
  const viewLink = reportList(page).getByRole("link", { name: /view|open/i }).first();
  await expect(viewLink).toBeVisible();
  await viewLink.click();
}

export async function openReportDetail(page: Page, reportId: string) {
  await page.goto(`/app/report/${encodeURIComponent(reportId)}`, { waitUntil: "domcontentloaded" });
  await assertReportDetailVisible(page);
}

export async function assertReportDetailVisible(page: Page) {
  await expect(reportDetail(page)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("report-not-found")).toHaveCount(0);
  await expect(page.getByTestId("report-error")).toHaveCount(0);
}

export async function assertCombinedSourcesVisible(page: Page, expectedSources: string[]) {
  await expect(page.getByTestId("report-combined-framing")).toBeVisible({ timeout: 30_000 });
  const chips = page.getByTestId("report-platform-chips");
  await expect(chips).toBeVisible({ timeout: 30_000 });
  for (const source of expectedSources) {
    await expect(chips).toContainText(new RegExp(source, "i"));
  }
}
