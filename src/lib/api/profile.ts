import { apiFetchJson } from "./client";

export type OnboardingState = {
  onboarding_completed: boolean;
  platform_preferences: string[] | null;
};

export async function fetchOnboardingProfile(): Promise<OnboardingState> {
  return apiFetchJson<OnboardingState>("fetchOnboardingProfile", "/v1/profile/onboarding");
}

export async function updateOnboardingProfile(update: {
  platform_preferences?: string[];
  onboarding_completed?: boolean;
}): Promise<OnboardingState> {
  return apiFetchJson<OnboardingState>("updateOnboardingProfile", "/v1/profile/onboarding", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
}

// ── Platform payouts (Pro feature) ───────────────────────────────────────────

export type PlatformPayoutEntry = {
  monthly_avg: number;
  currency?: string;
};

export type PlatformPayoutsState = {
  platform_payouts: Record<string, PlatformPayoutEntry> | null;
};

export async function fetchPlatformPayouts(): Promise<PlatformPayoutsState> {
  return apiFetchJson<PlatformPayoutsState>("fetchPlatformPayouts", "/v1/profile/platform-payouts");
}

export async function updatePlatformPayouts(
  platform_payouts: Record<string, PlatformPayoutEntry> | null,
): Promise<PlatformPayoutsState> {
  return apiFetchJson<PlatformPayoutsState>("updatePlatformPayouts", "/v1/profile/platform-payouts", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ platform_payouts }),
  });
}
