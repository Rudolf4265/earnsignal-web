import { test, expect, runOnlyForRole } from "../fixtures/auth";
import { datasets, platformIds, sourceNames } from "../fixtures/test-data";
import { getReportDetail, listReports, resetWorkspaceDataSources, waitForReportCompletion } from "../helpers/api";
import { expectCompletedReportToExist } from "../helpers/assertions";
import { assertReportDetailVisible, openReportDetail, triggerRunReport } from "../helpers/report";
import { assertRunReportEnabled, gotoWorkspace, uploadSourceFile, waitForSourceReady } from "../helpers/upload";

test.describe("single source report run @truth-gate", () => {
  test.beforeEach(async ({ page, role }) => {
    test.skip(role !== "report", "Single-source report run uses report-user only.");
    await resetWorkspaceDataSources(page.context().request, { role });
  });

  test("single source upload produces one completed report @truth-gate @smoke", async ({ page, role }) => {
    runOnlyForRole(role, "report");

    await gotoWorkspace(page);
    await uploadSourceFile(page, platformIds.patreon, datasets.patreon);
    await waitForSourceReady(page, sourceNames.patreon);
    await assertRunReportEnabled(page);
    await triggerRunReport(page);
    await page.waitForURL(/\/app\/report\/[^/]+$/, { timeout: 60_000 });

    const reportId = page.url().split("/").pop();
    expect(reportId).toBeTruthy();
    const completed = await waitForReportCompletion(page.context().request, reportId as string, undefined, { role });
    expect(["ready", "completed", "complete", "success", "succeeded"]).toContain(completed.status.toLowerCase());
  });

  test("report detail loads successfully after single source run @truth-gate @smoke", async ({ page, role }) => {
    runOnlyForRole(role, "report");

    await gotoWorkspace(page);
    await uploadSourceFile(page, platformIds.patreon, datasets.patreon);
    await waitForSourceReady(page, sourceNames.patreon);
    await triggerRunReport(page);
    await page.waitForURL(/\/app\/report\/[^/]+$/, { timeout: 60_000 });
    const reportId = page.url().split("/").pop() as string;
    await waitForReportCompletion(page.context().request, reportId, undefined, { role });
    await openReportDetail(page, reportId);
    await assertReportDetailVisible(page);
    await expect(page.getByTestId("report-single-source-framing").or(page.getByTestId("report-content"))).toBeVisible();
  });

  test("report list shows newly generated owned report @truth-gate", async ({ page, role }) => {
    runOnlyForRole(role, "report");

    const baseline = new Set((await listReports(page.context().request, { role })).map((report) => report.id));
    await gotoWorkspace(page);
    await uploadSourceFile(page, platformIds.patreon, datasets.patreon);
    await waitForSourceReady(page, sourceNames.patreon);
    await triggerRunReport(page);
    await page.waitForURL(/\/app\/report\/[^/]+$/, { timeout: 60_000 });
    const reportId = page.url().split("/").pop() as string;
    await waitForReportCompletion(page.context().request, reportId, undefined, { role });
    const reports = await listReports(page.context().request, { role });

    expectCompletedReportToExist(reports);
    expect(reports.some((report) => report.id === reportId && !baseline.has(report.id))).toBeTruthy();
    await getReportDetail(page.context().request, reportId, { role });
  });
});
