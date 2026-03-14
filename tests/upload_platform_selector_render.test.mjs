import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

test("upload platform selector renders grouped section headers and direct-fan reveal copy", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes('data-testid="upload-platform-guide"'), true);
  assert.equal(source.includes("Start with currently supported revenue exports"), true);
  assert.equal(source.includes("/app/help#upload-guide"), true);
  assert.equal(source.includes("platformSections.map((section) =>"), true);
  assert.equal(source.includes('data-testid={`platform-section-${section.category}`}'), true);
  assert.equal(source.includes("Choose your platform"), true);
  assert.equal(source.includes("Select the platform that matches your creator revenue export."), true);
  assert.equal(source.includes('data-testid="direct-fan-reveal"'), true);
  assert.equal(source.includes("setDirectFanExpanded((value) => !value)"), true);
  assert.equal(source.includes('className="overflow-hidden transition-[max-height] duration-200 ease-out"'), true);
  assert.equal(source.includes('style={{ maxHeight: directFanExpanded ? "560px" : "0px" }}'), true);
});

test("upload platform cards enforce 28x28 contain logos and disable unavailable options", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes("getSupportedRevenueUploadSummary()"), true);
  assert.equal(source.includes('className="platform-icon block h-[28px] w-[28px] object-contain"'), true);
  assert.equal(source.includes("disabled={!available}"), true);
  assert.equal(source.includes("if (!item.available) {"), true);
  assert.equal(source.includes("setPlatform(item.id);"), true);
  assert.equal(source.includes("setPlatform(backendId);"), true);
  assert.equal(source.includes("Available"), true);
  assert.equal(source.includes("Coming soon"), true);
});
