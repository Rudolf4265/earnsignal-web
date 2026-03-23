import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const reportListPagePath = path.resolve("app/(app)/app/report/page.tsx");

test("report list page derives PDF action state from entitlement snapshot", async () => {
  const source = await readFile(reportListPagePath, "utf8");

  assert.equal(source.includes('import { useEntitlementState } from "../../_components/use-entitlement-state";'), true);
  assert.equal(source.includes("const entitlementState = useEntitlementState();"), true);
  assert.equal(source.includes("const canOfferPdfDownload = row.canDownload && (entitlementState.canDownloadPdf || entitlementState.isFounder);"), true);
});

test("report list blocks download handler when canonical PDF entitlement is false", async () => {
  const source = await readFile(reportListPagePath, "utf8");

  assert.equal(source.includes("(!entitlementState.canDownloadPdf && !entitlementState.isFounder)"), true);
  assert.equal(source.includes('const downloadTooltip = row.canDownload ? "Report or Pro access is required to download this PDF" : "PDF not available yet";'), true);
});

test("report list suppresses billing CTA when founder override is active", async () => {
  const source = await readFile(reportListPagePath, "utf8");

  assert.equal(source.includes("state.entitlementRequired && !entitlementState.isFounder"), true);
  assert.equal(source.includes("downloadEntitlementRequired && !entitlementState.isFounder"), true);
});

test("report list renders source summary metadata when normalized source fields exist", async () => {
  const source = await readFile(reportListPagePath, "utf8");

  assert.equal(source.includes("row.sourceCountLabel || row.platformSummary"), true);
  assert.equal(source.includes('data-testid="report-list-source-summary"'), true);
  assert.equal(source.includes("row.sourceCountLabel ? <span>{row.sourceCountLabel}</span> : null"), true);
  assert.equal(source.includes("row.platformSummary ? <span>{row.platformSummary}</span> : null"), true);
});
