import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/report/source-labeling.ts")).href;

async function loadModule(seed = Date.now()) {
  return import(`${moduleUrl}?t=${seed}`);
}

test("canonical report title uses platform name for a single-source report", async () => {
  const { buildCanonicalReportTitle } = await loadModule(Date.now() + 1);

  const title = buildCanonicalReportTitle({
    createdAt: "2026-03-01T10:00:00Z",
    platformsIncluded: ["patreon"],
  });

  assert.equal(title, "Patreon Report — Mar 2026");
});

test("canonical report title names two-source combined reports in business order", async () => {
  const { buildCanonicalReportTitle } = await loadModule(Date.now() + 2);

  const title = buildCanonicalReportTitle({
    createdAt: "2026-03-01T10:00:00Z",
    platformsIncluded: ["substack", "patreon"],
  });

  assert.equal(title, "Combined Report — Patreon + Substack");
});

test("canonical report title names three-source combined reports in business order", async () => {
  const { buildCanonicalReportTitle } = await loadModule(Date.now() + 3);

  const title = buildCanonicalReportTitle({
    createdAt: "2026-03-01T10:00:00Z",
    platformsIncluded: ["youtube", "substack", "patreon"],
  });

  assert.equal(title, "Combined Report — Patreon + Substack + YouTube");
});

test("canonical report title switches to count-based naming for four or more sources", async () => {
  const { buildCanonicalReportTitle } = await loadModule(Date.now() + 4);

  const title = buildCanonicalReportTitle({
    createdAt: "2026-03-01T10:00:00Z",
    platformsIncluded: ["tiktok", "youtube", "instagram", "patreon"],
  });

  assert.equal(title, "Combined Report — 4 Sources");
});

test("canonical report title falls back to count-based combined naming when the backend count exceeds named platforms", async () => {
  const { buildCanonicalReportTitle, resolveReportSourceCount } = await loadModule(Date.now() + 41);

  const sourceCount = resolveReportSourceCount({
    platformsIncluded: ["patreon", "youtube"],
    sourceCount: 3,
  });
  const title = buildCanonicalReportTitle({
    createdAt: "2026-03-01T10:00:00Z",
    platformsIncluded: ["patreon", "youtube"],
    sourceCount,
  });

  assert.equal(sourceCount, 3);
  assert.equal(title, "Combined Report — 3 Sources");
});

test("canonical report title falls back to a neutral period-based name when source data is missing", async () => {
  const { buildCanonicalReportTitle } = await loadModule(Date.now() + 5);

  const title = buildCanonicalReportTitle({
    createdAt: "2026-03-01T10:00:00Z",
  });

  assert.equal(title, "Creator Report — Mar 2026");
});

test("single-source fallback naming stays explicit when count is known but platform labels are missing", async () => {
  const { buildCanonicalReportTitle, buildReportFraming } = await loadModule(Date.now() + 51);

  const title = buildCanonicalReportTitle({
    createdAt: "2026-03-01T10:00:00Z",
    sourceCount: 1,
  });
  const framing = buildReportFraming({ sourceCount: 1 });

  assert.equal(title, "Single-Source Report — Mar 2026");
  assert.equal(framing.badgeLabel, "Single-Source Report");
  assert.equal(framing.helperText, "Add another source to deepen your analysis.");
});

test("combined framing stays explicit for multi-source reports", async () => {
  const { buildReportFraming, formatIncludedSourceCountLabel } = await loadModule(Date.now() + 52);

  const framing = buildReportFraming({ sourceCount: 3, platformsIncluded: ["patreon", "substack", "youtube"] });

  assert.equal(framing.badgeLabel, "Combined Report");
  assert.equal(framing.helperText, "Built from multiple creator data sources.");
  assert.equal(formatIncludedSourceCountLabel(3), "3 sources included");
});

test("platform normalization dedupes aliases and preserves deterministic business ordering", async () => {
  const { normalizePlatformsIncluded } = await loadModule(Date.now() + 6);

  const platforms = normalizePlatformsIncluded(["youtube", "Patreon", "yt", "substack", "tik tok"]);

  assert.deepEqual(platforms, ["Patreon", "Substack", "YouTube", "TikTok"]);
});
