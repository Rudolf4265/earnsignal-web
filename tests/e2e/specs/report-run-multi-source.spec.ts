import { test, expect, runOnlyForRole } from "../fixtures/auth";
import { datasets, platformIds, sourceNames } from "../fixtures/test-data";
import { getReportDetail, resetWorkspaceDataSources, waitForReportCompletion } from "../helpers/api";
import { assertCombinedSourcesVisible, openReportDetail, triggerRunReport } from "../helpers/report";
import { addAnotherSource, assertRunReportEnabled, gotoWorkspace, uploadSourceFile, waitForSourceReady } from "../helpers/upload";
import { sourceRow } from "../helpers/selectors";

test.describe("multi-source combined report run @truth-gate", () => {
  test.beforeEach(async ({ page, role }) => {
    test.skip(role !== "report", "Multi-source report run uses report-user only.");
    await resetWorkspaceDataSources(page.context().request, { role });
  });

  test("multiple staged sources generate one combined report @truth-gate @combined-report @smoke", async ({ page, role }) => {
    runOnlyForRole(role, "report");

    await gotoWorkspace(page);
    await uploadSourceFile(page, platformIds.patreon, datasets.patreon);
    await waitForSourceReady(page, sourceNames.patreon);
    await addAnotherSource(page);
    await uploadSourceFile(page, platformIds.instagram, datasets.instagram);
    await waitForSourceReady(page, sourceNames.instagram);
    await assertRunReportEnabled(page);
    await triggerRunReport(page);
    await page.waitForURL(/\/app\/report\/[^/]+$/, { timeout: 60_000 });
    const reportId = page.url().split("/").pop() as string;
    await waitForReportCompletion(page.context().request, reportId, undefined, { role });
    const detail = await getReportDetail(page.context().request, reportId, { role });
    expect(detail.sourceCount ?? detail.platformsIncluded.length).toBeGreaterThanOrEqual(2);
  });

  test("combined report includes all uploaded ready sources @truth-gate @combined-report", async ({ page, role }) => {
    runOnlyForRole(role, "report");

    await gotoWorkspace(page);
    await uploadSourceFile(page, platformIds.patreon, datasets.patreon);
    await waitForSourceReady(page, sourceNames.patreon);
    await addAnotherSource(page);
    await uploadSourceFile(page, platformIds.instagram, datasets.instagram);
    await waitForSourceReady(page, sourceNames.instagram);
    await triggerRunReport(page);
    await page.waitForURL(/\/app\/report\/[^/]+$/, { timeout: 60_000 });
    const reportId = page.url().split("/").pop() as string;
    await waitForReportCompletion(page.context().request, reportId, undefined, { role });
    await openReportDetail(page, reportId);
    await assertCombinedSourcesVisible(page, [sourceNames.patreon, sourceNames.instagram]);
  });

  test("workspace staging persists across multiple uploads before run @truth-gate @combined-report", async ({ page, role }) => {
    runOnlyForRole(role, "report");

    await gotoWorkspace(page);
    await uploadSourceFile(page, platformIds.patreon, datasets.patreon);
    await waitForSourceReady(page, sourceNames.patreon);
    await addAnotherSource(page);
    await uploadSourceFile(page, platformIds.instagram, datasets.instagram);
    await waitForSourceReady(page, sourceNames.instagram);
    await expect(sourceRow(page, platformIds.patreon)).toContainText(/Ready|Connected/i);
    await expect(sourceRow(page, platformIds.instagram)).toContainText(/Ready|Connected/i);
    await assertRunReportEnabled(page);
  });
});
