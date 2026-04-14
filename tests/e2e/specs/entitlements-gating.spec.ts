import { test, runOnlyForRole } from "../fixtures/auth";
import { getLatestOwnedReport } from "../helpers/api";
import { expectEntitlementSurface } from "../helpers/assertions";
import { assertReportDetailVisible, openReportDetail } from "../helpers/report";

test.describe("entitlements gating @truth-gate @entitlements", () => {
  test("free user sees teaser and not full owned report access @truth-gate @entitlements", async ({ page, role }) => {
    runOnlyForRole(role, "free");

    const report = await getLatestOwnedReport(page.context().request, { role: "report" });
    await page.goto(`/app/report/${encodeURIComponent(report.id)}`, { waitUntil: "domcontentloaded" });
    await expectEntitlementSurface(page, role);
  });

  test("report tier user can open owned report and download pdf @truth-gate @entitlements @pdf @smoke", async ({ page, role }) => {
    runOnlyForRole(role, "report");

    const report = await getLatestOwnedReport(page.context().request, { role });
    await openReportDetail(page, report.id);
    await assertReportDetailVisible(page);
    await expectEntitlementSurface(page, role);
  });

  test("pro user can access report history and dashboard intelligence surfaces @truth-gate @entitlements", async ({ page, role }) => {
    runOnlyForRole(role, "pro");

    await page.goto("/app/report", { waitUntil: "domcontentloaded" });
    await expectEntitlementSurface(page, role);
    await page.goto("/app/dashboard", { waitUntil: "domcontentloaded" });
    await expectEntitlementSurface(page, role);
  });
});
