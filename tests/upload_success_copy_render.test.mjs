import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

test("upload stepper success copy reflects growth and revenue truth by platform", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes("Included in your next report and used to generate growth insights."), true);
  assert.equal(source.includes("Included in both revenue and growth insights."), true);
  assert.equal(source.includes("Included in your next combined report."), false);
  assert.equal(source.includes("Ready for review in the workspace."), false);
  assert.equal(source.includes("This source is staged and ready for your next report."), false);
});
