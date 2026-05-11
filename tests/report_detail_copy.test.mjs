import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/report/detail-copy.ts")).href;

async function loadModule(seed = Date.now()) {
  return import(`${moduleUrl}?t=${seed}`);
}

test("rewriteReportSnapshotCoverageNote replaces the legacy all-sources snapshot claim", async () => {
  const { rewriteReportSnapshotCoverageNote } = await loadModule(Date.now() + 1);

  const result = rewriteReportSnapshotCoverageNote(
    "Current snapshot reflects the most recent month where all sources have data (May 2026).",
  );

  assert.equal(
    result,
    "Current snapshot reflects the latest available business month. Audience and discovery sources may cover different recent months depending on the uploaded export.",
  );
});

test("rewriteReportSnapshotCoverageNote preserves already-truthful uneven coverage wording", async () => {
  const { rewriteReportSnapshotCoverageNote } = await loadModule(Date.now() + 2);

  const result = rewriteReportSnapshotCoverageNote(
    "Combined metrics use 5 overlapping months (Nov 2024–Mar 2025). Source histories: Patreon 8 months, Substack 7 months, YouTube 5 months.",
  );

  assert.equal(
    result,
    "Combined metrics use 5 overlapping months (Nov 2024–Mar 2025). Source histories: Patreon 8 months, Substack 7 months, YouTube 5 months.",
  );
});

test("buildReportSourceRoleLine explains revenue and audience source roles when both are present", async () => {
  const { buildReportSourceRoleLine } = await loadModule(Date.now() + 3);

  const result = buildReportSourceRoleLine(["instagram", "substack", "youtube", "patreon"]);

  assert.equal(
    result,
    "Revenue sources: Patreon, Substack. Audience and discovery sources: YouTube, Instagram.",
  );
});

test("buildReportSourceRoleLine stays quiet when the report only includes one source role", async () => {
  const { buildReportSourceRoleLine } = await loadModule(Date.now() + 4);

  assert.equal(buildReportSourceRoleLine(["patreon", "substack"]), null);
  assert.equal(buildReportSourceRoleLine(["youtube", "instagram"]), null);
});
