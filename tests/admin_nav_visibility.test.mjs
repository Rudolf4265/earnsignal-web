import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const navLinksUrl = pathToFileURL(path.resolve("src/lib/navigation/workspace-nav-links.ts")).href;

test("admin nav link is hidden until admin status is confirmed", async () => {
  const { buildWorkspaceNavLinks } = await import(`${navLinksUrl}?t=${Date.now()}-hidden`);

  const unknownLinks = buildWorkspaceNavLinks("unknown");
  const nonAdminLinks = buildWorkspaceNavLinks("not_admin");

  assert.equal(unknownLinks.some((link) => link.id === "admin"), false);
  assert.equal(nonAdminLinks.some((link) => link.id === "admin"), false);
});

test("admin nav link is present for confirmed admins", async () => {
  const { buildWorkspaceNavLinks } = await import(`${navLinksUrl}?t=${Date.now()}-present`);
  const adminLinks = buildWorkspaceNavLinks("admin");

  assert.equal(adminLinks.some((link) => link.id === "admin"), true);
});
