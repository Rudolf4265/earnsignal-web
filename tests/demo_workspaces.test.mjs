import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/demo/demo-workspaces.ts")).href;

async function loadModule(seed = Date.now()) {
  return import(`${moduleUrl}?t=${seed}`);
}

test("demo workspaces include a realistic set of QA personas", async () => {
  const { DEMO_WORKSPACES } = await loadModule(Date.now() + 1);

  assert.equal(DEMO_WORKSPACES.length >= 6, true);
  assert.equal(DEMO_WORKSPACES.length, 8);
  assert.equal(new Set(DEMO_WORKSPACES.map((workspace) => workspace.id)).size, DEMO_WORKSPACES.length);

  for (const workspace of DEMO_WORKSPACES) {
    assert.equal(typeof workspace.label, "string");
    assert.equal(workspace.label.length > 0, true);
    assert.equal(typeof workspace.shortLabel, "string");
    assert.equal(workspace.shortLabel.length > 0, true);
    assert.equal(typeof workspace.scenario, "string");
    assert.equal(workspace.scenario.length > 0, true);
    assert.equal(typeof workspace.description, "string");
    assert.equal(workspace.description.length > 0, true);
    assert.equal(workspace.dashboard.primaryCtaHref.startsWith("/app/"), true);
  }
});

test("demo workspaces cover earn-heavy, grow-heavy, sparse, and partial states", async () => {
  const { getDemoWorkspaceFixture } = await loadModule(Date.now() + 2);

  const earnHeavy = getDemoWorkspaceFixture("youtube-heavy");
  const growHeavy = getDemoWorkspaceFixture("audience-first");
  const sparse = getDemoWorkspaceFixture("new-workspace");
  const partial = getDemoWorkspaceFixture("partial-workspace");

  assert.equal(earnHeavy.dashboard.earn.model.creatorHealth.title, "Your creator health score is 87/100.");
  assert.equal(earnHeavy.dashboard.earn.model.revenueSnapshot.revenueDisplay, "$48,200");
  assert.equal(earnHeavy.dashboard.utility.latestReportRow?.id, "demo-youtube-heavy-rpt");

  assert.equal(growHeavy.defaultMode, "grow");
  assert.equal(growHeavy.dashboard.grow.model?.creatorScore?.score, 83);
  assert.equal(growHeavy.dashboard.grow.model?.topOpportunity?.title.includes("email signup"), true);

  assert.equal(sparse.dashboard.hasUpload, false);
  assert.equal(sparse.dashboard.hasReports, false);
  assert.equal(sparse.dashboard.grow.model, null);
  assert.equal(sparse.dashboard.utility.latestReportRow, null);
  assert.equal(sparse.dashboard.utility.workspaceReadiness.includes("still empty"), true);

  assert.equal(partial.dashboard.hasUpload, true);
  assert.equal(partial.dashboard.hasReports, true);
  assert.equal(partial.dashboard.earn.model.creatorHealth.title, "Creator health is provisional at 67/100.");
  assert.equal(partial.dashboard.grow.model?.availability, "partial");
  assert.equal(partial.dashboard.utility.reportsCheckError?.includes("intentionally incomplete"), true);
});

test("demo workspaces preserve locked and unlocked dashboard states without changing real entitlement logic", async () => {
  const { getDemoWorkspaceFixture } = await loadModule(Date.now() + 3);

  const membershipLed = getDemoWorkspaceFixture("membership-led");
  const balanced = getDemoWorkspaceFixture("balanced-business");

  assert.equal(membershipLed.dashboard.earn.actionCards.mode, "locked");
  assert.equal(membershipLed.dashboard.utility.planTier, "Report");
  assert.equal(membershipLed.dashboard.utility.entitled, true);

  assert.equal(balanced.dashboard.earn.actionCards.mode, "unlocked");
  assert.equal(balanced.dashboard.utility.planTier, "Pro");
  assert.equal(balanced.dashboard.grow.model?.availability, "structured");
});

test("demo workspace search and mode resolution stay explicit and isolated", async () => {
  const { buildDemoWorkspaceSearch, resolveDemoWorkspaceMode, getDemoWorkspaceFixture } = await loadModule(Date.now() + 4);

  const defaultAudienceSearch = buildDemoWorkspaceSearch(new URLSearchParams("mode=earn"), "audience-first");
  const newWorkspaceSearch = buildDemoWorkspaceSearch(new URLSearchParams("persona=audience-first&mode=grow"), "new-workspace");
  const audienceWorkspace = getDemoWorkspaceFixture("audience-first");
  const sparseWorkspace = getDemoWorkspaceFixture("new-workspace");

  assert.equal(defaultAudienceSearch.includes("persona=audience-first"), true);
  assert.equal(defaultAudienceSearch.includes("mode=grow"), true);
  assert.equal(newWorkspaceSearch.includes("persona=new-workspace"), true);
  assert.equal(newWorkspaceSearch.includes("mode=grow"), false);

  assert.equal(resolveDemoWorkspaceMode(null, audienceWorkspace), "grow");
  assert.equal(resolveDemoWorkspaceMode(undefined, sparseWorkspace), "earn");
  assert.equal(resolveDemoWorkspaceMode("grow", sparseWorkspace), "grow");
});
