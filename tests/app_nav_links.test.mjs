import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/navigation/app-nav.ts")).href;

test("app navigation links route Data and Billing to distinct paths", async () => {
  const { APP_NAV_LINKS } = await import(`${moduleUrl}?t=${Date.now()}`);
  const dataLink = APP_NAV_LINKS.find((link) => link.label === "Data");
  const billingLink = APP_NAV_LINKS.find((link) => link.label === "Billing");

  assert.equal(dataLink?.href, "/app/data");
  assert.equal(billingLink?.href, "/app/billing");
  assert.notEqual(dataLink?.href, billingLink?.href);
});
