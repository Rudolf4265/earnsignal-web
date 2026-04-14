import { expect, type Page } from "@playwright/test";
import type { E2ERole } from "./env";
import { runReportButton, selectors, sourceRow } from "./selectors";

type WorkspaceApiState = {
  runReportEnabled: boolean;
  readySourceCount: number;
  sources: Array<{ platform: string; state: string }>;
};

type ApiReport = {
  id: string;
  status: string;
};

export async function expectWorkspaceReadyStateToMatchApi(page: Page, apiState: WorkspaceApiState) {
  if (apiState.runReportEnabled) {
    await expect(runReportButton(page)).toBeEnabled();
  } else {
    await expect(runReportButton(page)).toBeDisabled();
  }

  for (const source of apiState.sources) {
    const row = sourceRow(page, source.platform);
    await expect(row).toBeVisible();
    if (source.state === "ready") {
      await expect(row).toContainText(/Ready|Connected/i);
    } else if (source.state === "processing") {
      await expect(row).toContainText(/Processing|Working|Checking/i);
    } else if (source.state === "failed") {
      await expect(row).toContainText(/Failed|Fix needed|Needs review/i);
    }
  }
}

export async function expectSourceCountToMatchUi(page: Page, expectedCount: number) {
  await expect(page.getByText(new RegExp(`${expectedCount} source${expectedCount === 1 ? "" : "s"} ready`, "i"))).toBeVisible();
}

export function expectCompletedReportToExist(apiReports: ApiReport[]) {
  const completed = apiReports.find((report) => ["ready", "completed", "complete", "success", "succeeded"].includes(report.status.toLowerCase()));
  expect(completed, "Expected at least one completed owned report").toBeTruthy();
  return completed as ApiReport;
}

export async function expectEntitlementSurface(page: Page, role: E2ERole) {
  if (role === "free") {
    await expect(page.getByTestId(selectors.freeTeaser).or(page.getByTestId("report-entitlement-required"))).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("report-wow-summary")).toHaveCount(0);
    return;
  }

  if (role === "report") {
    await expect(page.getByTestId(selectors.reportDetail)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("button", { name: /download pdf/i })).toBeVisible({ timeout: 30_000 });
    return;
  }

  await expect(page.getByTestId(selectors.dashboardNavItem)).toBeVisible({ timeout: 60_000 });
  await expect(
    page.getByTestId("nav-reports")
      .or(page.getByTestId(selectors.dashboardIntelligenceSurface))
      .or(page.getByTestId("grow-dashboard-section"))
      .or(page.getByRole("heading", { name: /Dashboard/i })),
  ).toBeVisible({ timeout: 30_000 });
}
