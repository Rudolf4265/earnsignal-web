import { test, expect, runOnlyForRole } from "../fixtures/auth";
import { assertPdfAvailable, getLatestOwnedReport } from "../helpers/api";
import { assertDownloadedFileNonEmpty, downloadPdfFromUi } from "../helpers/artifacts";
import { openReportDetail } from "../helpers/report";

test.describe("PDF availability @truth-gate @pdf", () => {
  test("completed report exposes a downloadable pdf artifact @truth-gate @pdf @smoke", async ({ page, role }) => {
    runOnlyForRole(role, "report");

    const report = await getLatestOwnedReport(page.context().request, { role });
    await openReportDetail(page, report.id);
    await expect(page.getByRole("button", { name: /download pdf/i })).toBeVisible({ timeout: 30_000 });
    const filePath = await downloadPdfFromUi(page);
    assertDownloadedFileNonEmpty(filePath);
  });

  test("pdf endpoint returns a non-empty artifact for completed report @truth-gate @pdf", async ({ page, role }) => {
    runOnlyForRole(role, "report");

    const report = await getLatestOwnedReport(page.context().request, { role });
    await assertPdfAvailable(page.context().request, report.id, { role });
  });
});
