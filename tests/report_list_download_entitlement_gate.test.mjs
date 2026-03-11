import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const reportListPagePath = path.resolve("app/(app)/app/report/page.tsx");

test("report list page derives PDF action state from entitlement snapshot", async () => {
  const source = await readFile(reportListPagePath, "utf8");

  assert.equal(source.includes('import { useEntitlementState } from "../../_components/use-entitlement-state";'), true);
  assert.equal(source.includes("const entitlementState = useEntitlementState();"), true);
  assert.equal(source.includes("const canOfferPdfDownload = row.canDownload && entitlementState.canDownloadPdf;"), true);
});

test("report list blocks download handler when canonical PDF entitlement is false", async () => {
  const source = await readFile(reportListPagePath, "utf8");

  assert.equal(source.includes("if (!row.canDownload || !entitlementState.canDownloadPdf || !row.reportId || !row.artifactUrl || downloadingReportId)"), true);
  assert.equal(source.includes('const downloadTooltip = row.canDownload ? "Upgrade to Pro to download PDF" : "PDF not available yet";'), true);
});
