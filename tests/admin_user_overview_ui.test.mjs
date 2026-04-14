import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const adminPagePath = "app/(app)/app/admin/page.tsx";
const overviewComponentPath = "app/(app)/app/admin/_components/AdminUserOverview.tsx";

test("admin page inserts user overview between archived toggle and user table", async () => {
  const source = await readFile(adminPagePath, "utf8");

  assert.equal(source.includes('import { AdminUserOverview } from "./_components/AdminUserOverview";'), true);
  assert.equal(source.includes("Search by email (creator ID also works)"), true);
  assert.equal(source.includes("Show archived users"), true);
  assert.equal(source.includes("Grant access by email"), true);

  const archivedIndex = source.indexOf("Show archived users");
  const overviewIndex = source.indexOf("<AdminUserOverview includeArchived={showArchived} />");
  const tableIndex = source.indexOf("<table");

  assert.equal(archivedIndex !== -1, true);
  assert.equal(overviewIndex !== -1, true);
  assert.equal(tableIndex !== -1, true);
  assert.equal(archivedIndex < overviewIndex, true);
  assert.equal(overviewIndex < tableIndex, true);
});

test("admin overview component renders required copy, tiles, windows, csv export, and isolated error state", async () => {
  const source = await readFile(overviewComponentPath, "utf8");

  assert.equal(source.includes("User overview"), true);
  assert.equal(source.includes("Tier totals and recent account activity."), true);

  for (const label of ["Total users", "Free", "Report", "Pro", "Non-Paying"]) {
    assert.equal(source.includes(label), true, `${label} tile label must render`);
  }

  assert.equal(source.includes('const WINDOWS: AdminUserOverviewWindow[] = ["24h", "7d", "30d"];'), true);
  assert.equal(source.includes("setWindowValue(option)"), true);
  assert.equal(source.includes("fetchAdminUserOverview(windowValue, { includeArchived })"), true);
  assert.equal(source.includes("aria-pressed={windowValue === option}"), true);

  assert.equal(source.includes("In selected period:"), true);
  assert.equal(source.includes("Report upgrades"), true);
  assert.equal(source.includes("Pro upgrades"), true);
  assert.equal(source.includes("Non-Paying grants"), true);

  assert.equal(source.includes("Export CSV"), true);
  assert.equal(source.includes("text/csv;charset=utf-8"), true);
  assert.equal(source.includes("admin-user-overview-${data.window}.csv"), true);

  assert.equal(source.includes("Could not load user overview"), true);
  assert.equal(source.includes("ErrorBanner"), true);
  assert.equal(source.includes("No overview metrics available."), true);
  assert.equal(source.includes("Manual/admin-granted access not tied to a current paid plan."), true);
});
