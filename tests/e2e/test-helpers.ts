import { expect, Page, type Route } from "@playwright/test";
import entitlementsEntitled from "./fixtures/entitlements.entitled.json";
import entitlementsUnentitled from "./fixtures/entitlements.unentitled.json";
import entitlementsSessionExpired from "./fixtures/entitlements.session_expired.json";
import uploadProcessing from "./fixtures/upload.processing.json";
import uploadReportReady from "./fixtures/upload.report_ready.json";
import uploadValidationFailed from "./fixtures/upload.validation_failed.json";

const SUPABASE_URL = "https://mock-project.supabase.co";
const SUPABASE_ANON = "mock-anon-key";

type ApiEnvelope = {
  status: string;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  request_id?: string;
};

type EntitlementsFixtureName = "entitled" | "unentitled";

const fixtureByEntitlement: Record<EntitlementsFixtureName, ApiEnvelope> = {
  entitled: entitlementsEntitled as ApiEnvelope,
  unentitled: entitlementsUnentitled as ApiEnvelope,
};

export function toApiBody(envelope: ApiEnvelope): Record<string, unknown> {
  return {
    ...(envelope.details ?? {}),
    status: envelope.details?.status ?? envelope.status,
    code: envelope.code,
    message: envelope.message,
    request_id: envelope.request_id,
  };
}

export async function stubUnauthenticatedSession(page: Page) {
  await page.addInitScript(([supabaseUrl, supabaseAnon]) => {
    (window as Window & { process?: { env?: Record<string, string> } }).process = {
      env: {
        NEXT_PUBLIC_API_BASE_URL: window.location.origin,
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnon,
      },
    };

    const projectRef = new URL(supabaseUrl).host.split(".")[0];
    window.localStorage.removeItem(`sb-${projectRef}-auth-token`);
  }, [SUPABASE_URL, SUPABASE_ANON]);
}

export async function stubAuthenticatedSession(page: Page) {
  await page.addInitScript(([supabaseUrl, supabaseAnon]) => {
    (window as Window & { process?: { env?: Record<string, string> } }).process = {
      env: {
        NEXT_PUBLIC_API_BASE_URL: window.location.origin,
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnon,
      },
    };

    const projectRef = new URL(supabaseUrl).host.split(".")[0];
    const now = Math.floor(Date.now() / 1000);

    window.localStorage.setItem(
      `sb-${projectRef}-auth-token`,
      JSON.stringify({
        access_token: "access-token",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: now + 3600,
        refresh_token: "refresh-token",
        user: {
          id: "user_123",
          email: "staff@earnsignal.test",
          app_metadata: {},
          user_metadata: {},
          aud: "authenticated",
          role: "authenticated",
        },
      }),
    );
  }, [SUPABASE_URL, SUPABASE_ANON]);

  await page.route(`${SUPABASE_URL}/auth/v1/**`, async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname.endsWith("/user")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "user_123",
          email: "staff@earnsignal.test",
          role: "authenticated",
          app_metadata: {},
          user_metadata: {},
        }),
      });
      return;
    }

    if (url.pathname.endsWith("/token")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "access-token",
          refresh_token: "refresh-token",
          expires_in: 3600,
          token_type: "bearer",
          user: {
            id: "user_123",
            email: "staff@earnsignal.test",
          },
        }),
      });
      return;
    }

    await route.fulfill({ status: 200, body: "{}", contentType: "application/json" });
  });
}

export async function stubEntitlements(page: Page, fixture: EntitlementsFixtureName) {
  const envelope = fixtureByEntitlement[fixture];
  await page.route("**/v1/entitlements", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(toApiBody(envelope)),
    });
  });
}

export async function stubEntitlementsSessionExpired(page: Page) {
  await page.route("**/v1/entitlements", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify(entitlementsSessionExpired),
    });
  });
}

export async function stubUnhandledApiRoutes(page: Page) {
  await page.route("**/v1/**", async (route: Route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        status: "error",
        code: "UNMOCKED_ROUTE",
        message: `Missing route stub for ${route.request().method()} ${route.request().url()}`,
        request_id: "req_unmocked_001",
      }),
    });
  });
}

export async function assertNoGateLoading(page: Page) {
  await expect(page.getByTestId("gate-loading")).toHaveCount(0);
}

export const uploadFixtures = {
  processing: uploadProcessing as ApiEnvelope,
  reportReady: uploadReportReady as ApiEnvelope,
  validationFailed: uploadValidationFailed as ApiEnvelope,
};
