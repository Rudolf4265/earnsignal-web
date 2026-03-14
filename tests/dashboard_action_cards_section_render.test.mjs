import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const actionCardsSectionPath = path.resolve("app/(app)/app/_components/dashboard/ActionCardsSection.tsx");

test("ActionCardsSection includes unlocked rendering for recommendation cards", async () => {
  const source = await readFile(actionCardsSectionPath, "utf8");

  assert.equal(source.includes("mode === \"unlocked\""), true);
  assert.equal(source.includes('data-testid="dashboard-action-cards-unlocked"'), true);
  assert.equal(source.includes("supportingCards.map((card, index) => ("), true);
  assert.equal(source.includes("featuredCard.label"), true);
  assert.equal(source.includes("card.stateLabel"), true);
  assert.equal(source.includes("card.detail"), true);
});

test("ActionCardsSection includes locked upsell rendering for Basic users", async () => {
  const source = await readFile(actionCardsSectionPath, "utf8");

  assert.equal(source.includes('data-testid="dashboard-action-cards-locked"'), true);
  assert.equal(source.includes("Unlock prioritized next actions."), true);
  assert.equal(source.includes("Upgrade to Pro to unlock tailored next steps based on your revenue, subscriber, and diagnosis signals."), true);
  assert.equal(source.includes("Upgrade to Pro"), true);
});

test("ActionCardsSection includes loading-safe rendering while entitlements resolve", async () => {
  const source = await readFile(actionCardsSectionPath, "utf8");

  assert.equal(source.includes('data-testid="dashboard-action-cards-loading"'), true);
  assert.equal(source.includes("Checking access to premium next actions..."), true);
});
