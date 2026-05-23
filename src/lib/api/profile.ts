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
