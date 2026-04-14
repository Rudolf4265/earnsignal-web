import { test, expect, runOnlyForRole } from "../fixtures/auth";
import { getWorkspaceDataSources, resetWorkspaceDataSources } from "../helpers/api";
import { expectSourceCountToMatchUi, expectWorkspaceReadyStateToMatchApi } from "../helpers/assertions";
import { platformIds, datasets, sourceNames } from "../fixtures/test-data";
import { assertRunReportDisabled, assertRunReportEnabled, gotoWorkspace, uploadSourceFile, waitForSourceReady } from "../helpers/upload";

test.describe("upload workspace readiness @truth-gate", () => {
  test.beforeEach(async ({ page, role }) => {
    test.skip(role !== "report", "Workspace readiness runs against report-user only.");
    await resetWorkspaceDataSources(page.context().request, { role });
  });

  test("workspace shows run report disabled before any ready source @truth-gate @smoke", async ({ page, role }) => {
    runOnlyForRole(role, "report");

    await gotoWorkspace(page);
    await assertRunReportDisabled(page);
  });

  test("workspace enables run report after a valid source finishes processing @truth-gate @smoke", async ({ page, role }) => {
    runOnlyForRole(role, "report");

    await gotoWorkspace(page);
    await uploadSourceFile(page, platformIds.patreon, datasets.patreon);
    await waitForSourceReady(page, sourceNames.patreon);
    await assertRunReportEnabled(page);
  });

  test("workspace source card state matches backend readiness response @truth-gate", async ({ page, role }) => {
    runOnlyForRole(role, "report");

    await gotoWorkspace(page);
    await uploadSourceFile(page, platformIds.patreon, datasets.patreon);
    await waitForSourceReady(page, sourceNames.patreon);
    const apiState = await getWorkspaceDataSources(page.context().request, { role });
    await expectWorkspaceReadyStateToMatchApi(page, apiState);
    await expectSourceCountToMatchUi(page, apiState.readySourceCount);
    expect(apiState.sources.some((source) => source.platform === platformIds.patreon && source.state === "ready")).toBeTruthy();
  });
});
