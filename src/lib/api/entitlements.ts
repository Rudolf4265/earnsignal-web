export type EntitlementFeatures = {
  app?: boolean;
  upload?: boolean;
  report?: boolean;
  [key: string]: boolean | undefined;
};

export type EntitlementsResponse = {
  plan: string | null;
  status: string | null;
  entitled: boolean;
  features: EntitlementFeatures;
  portal_url?: string;
};

export type CheckoutPlan = "plan_a" | "plan_b";

export type CheckoutResponse = {
  checkout_url: string;
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
const ENTITLEMENTS_CACHE_KEY = "earnsignal.entitlements.v1";
const ENTITLEMENTS_TTL_MS = 60_000;
const CHECKOUT_ATTEMPT_KEY = "earnsignal.checkout.attempt.v1";
const CHECKOUT_ATTEMPT_TTL_MS = 20_000;

let memoryCache: { value: EntitlementsResponse; fetchedAt: number } | null = null;
let inFlightEntitlements: Promise<EntitlementsResponse> | null = null;
let inFlightCheckout: Promise<CheckoutResponse> | null = null;

export function resetEntitlementsCache() {
  memoryCache = null;
  inFlightEntitlements = null;

  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(ENTITLEMENTS_CACHE_KEY);
  }
}

function readStorageCache(): { value: EntitlementsResponse; fetchedAt: number } | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(ENTITLEMENTS_CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { value?: EntitlementsResponse; fetchedAt?: number };
    if (!parsed.value || !parsed.fetchedAt) {
      return null;
    }

    return { value: parsed.value, fetchedAt: parsed.fetchedAt };
  } catch {
    return null;
  }
}

function writeStorageCache(value: EntitlementsResponse, fetchedAt: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(ENTITLEMENTS_CACHE_KEY, JSON.stringify({ value, fetchedAt }));
}

function isFresh(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < ENTITLEMENTS_TTL_MS;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const { createClient } = await import("../supabase/client");
    const {
      data: { session },
    } = await createClient().auth.getSession();

    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  } catch {
    return {};
  }
}

function normalizeEntitlements(value: Record<string, unknown>): EntitlementsResponse {
  const features = (value.features as EntitlementFeatures | undefined) ?? {};
  const plan = (value.plan as string | null | undefined) ?? null;
  const status = (value.status as string | null | undefined) ?? null;
  const entitled =
    (value.entitled as boolean | undefined) ??
    Boolean((features.app ?? features.upload ?? features.report ?? (status === "active" || status === "trialing")));

  return {
    plan,
    status,
    entitled,
    features,
    portal_url: (value.portal_url as string | undefined) ?? (value.portalUrl as string | undefined),
  };
}

export async function fetchEntitlements(options?: { forceRefresh?: boolean }): Promise<EntitlementsResponse> {
  const forceRefresh = options?.forceRefresh ?? false;

  if (!forceRefresh && memoryCache && isFresh(memoryCache.fetchedAt)) {
    return memoryCache.value;
  }

  if (!forceRefresh) {
    const storageCache = readStorageCache();
    if (storageCache && isFresh(storageCache.fetchedAt)) {
      memoryCache = storageCache;
      return storageCache.value;
    }

    if (inFlightEntitlements) {
      return inFlightEntitlements;
    }
  }

  inFlightEntitlements = (async () => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${apiBase}/v1/entitlements`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch entitlements (${response.status})`);
    }

    const body = (await response.json()) as Record<string, unknown>;
    const value = normalizeEntitlements(body);
    const fetchedAt = Date.now();

    memoryCache = { value, fetchedAt };
    writeStorageCache(value, fetchedAt);
    return value;
  })();

  try {
    return await inFlightEntitlements;
  } finally {
    inFlightEntitlements = null;
  }
}

function extractCheckoutUrl(payload: Record<string, unknown>): string | null {
  const checkoutUrl =
    (payload.checkout_url as string | undefined) ??
    (payload.checkoutUrl as string | undefined) ??
    (payload.url as string | undefined);

  if (!checkoutUrl || typeof checkoutUrl !== "string") {
    return null;
  }

  return checkoutUrl;
}

function validateCheckoutUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") {
      throw new Error("Checkout URL must use HTTPS");
    }

    return parsed.toString();
  } catch {
    throw new Error("Invalid checkout URL returned by billing API");
  }
}

function hasRecentCheckoutAttempt(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const raw = window.sessionStorage.getItem(CHECKOUT_ATTEMPT_KEY);
  if (!raw) {
    return false;
  }

  const parsedTs = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsedTs)) {
    window.sessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY);
    return false;
  }

  if (Date.now() - parsedTs >= CHECKOUT_ATTEMPT_TTL_MS) {
    window.sessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY);
    return false;
  }

  return true;
}

function setCheckoutAttemptMarker() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(CHECKOUT_ATTEMPT_KEY, String(Date.now()));
}

function clearCheckoutAttemptMarker() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY);
}

export function checkoutAttemptInProgress(): boolean {
  return hasRecentCheckoutAttempt();
}

export function clearCheckoutAttempt() {
  clearCheckoutAttemptMarker();
}

async function requestCheckout(path: string, headers: Record<string, string>, plan: CheckoutPlan): Promise<CheckoutResponse> {
  const response = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ plan }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create checkout session (${response.status})`);
  }

  const body = (await response.json()) as Record<string, unknown>;
  const checkoutUrl = extractCheckoutUrl(body);

  if (!checkoutUrl) {
    throw new Error("Checkout URL missing from response");
  }

  return { checkout_url: validateCheckoutUrl(checkoutUrl) };
}

export async function createCheckoutSession(plan: CheckoutPlan): Promise<CheckoutResponse> {
  if (inFlightCheckout) {
    return inFlightCheckout;
  }

  if (hasRecentCheckoutAttempt()) {
    throw new Error("Checkout is already starting. Please wait a moment.");
  }

  setCheckoutAttemptMarker();

  inFlightCheckout = (async () => {
    const headers = await getAuthHeaders();

    try {
      return await requestCheckout("/v1/billing/checkout", headers, plan);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Checkout session creation failed";
      if (!message.includes("(404)") && !message.includes("(405)")) {
        throw err;
      }

      return requestCheckout("/v1/checkout", headers, plan);
    }
  })();

  try {
    return await inFlightCheckout;
  } catch (err) {
    clearCheckoutAttemptMarker();
    throw err;
  } finally {
    inFlightCheckout = null;
  }
}

export { extractCheckoutUrl, validateCheckoutUrl };
