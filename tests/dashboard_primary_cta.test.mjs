import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ctaModuleUrl = pathToFileURL(path.resolve("src/lib/dashboard/primary-cta.ts")).href;

async function loadModule(seed = Date.now()) {
  return import(`${ctaModuleUrl}?t=${seed}`);
}

test("returns Upgrade when user is not entitled", async () => {
  const { decideDashboardPrimaryCta } = await loadModule(Date.now() + 1);

  const cta = decideDashboardPrimaryCta({
    entitled: false,
    hasUploads: true,
    hasReports: true,
  });

  assert.deepEqual(cta, {
    kind: "upgrade",
    label: "Upgrade",
    href: "/app/billing",
  });
});

test("returns Upload data when entitled user has no uploads", async () => {
  const { decideDashboardPrimaryCta } = await loadModule(Date.now() + 2);

  const cta = decideDashboardPrimaryCta({
    entitled: true,
    hasUploads: false,
    hasReports: false,
  });

  assert.deepEqual(cta, {
    kind: "upload_data",
    label: "Upload data",
    href: "/app/data",
  });
});

test("returns Generate report when uploads exist but reports do not", async () => {
  const { decideDashboardPrimaryCta } = await loadModule(Date.now() + 3);

  const cta = decideDashboardPrimaryCta({
    entitled: true,
    hasUploads: true,
    hasReports: false,
  });

  assert.deepEqual(cta, {
    kind: "generate_report",
    label: "Generate report",
    href: "/app/data",
  });
});

test("returns View reports when entitled user has uploads and reports", async () => {
  const { decideDashboardPrimaryCta } = await loadModule(Date.now() + 4);

  const cta = decideDashboardPrimaryCta({
    entitled: true,
    hasUploads: true,
    hasReports: true,
  });

  assert.deepEqual(cta, {
    kind: "view_reports",
    label: "View reports",
    href: "/app/report",
  });
});
