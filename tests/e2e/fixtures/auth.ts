import { test as base, expect } from "@playwright/test";
import type { E2ERole } from "../helpers/env";
import { roleFromProjectName } from "../helpers/env";

type AuthFixtures = {
  role: E2ERole;
};

export const test = base.extend<AuthFixtures>({
  role: async ({}, fixtureUse, testInfo) => {
    await fixtureUse(roleFromProjectName(testInfo.project.name));
  },
});

export { expect };

export function runOnlyForRole(role: E2ERole, expectedRole: E2ERole) {
  test.skip(role !== expectedRole, `Runs only for ${expectedRole}-user project.`);
}
