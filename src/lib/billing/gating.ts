export type AppGateDecision = "allow" | "show_loading" | "redirect_login" | "redirect_billing";

export function decideAppGate(params: {
  hasSession: boolean;
  isLoadingSession: boolean;
  isLoadingEntitlements: boolean;
  isEntitled: boolean;
  pathname: string;
}): AppGateDecision {
  const { hasSession, isLoadingSession, isLoadingEntitlements, isEntitled, pathname } = params;

  if (isLoadingSession || (hasSession && isLoadingEntitlements)) {
    return "show_loading";
  }

  if (!hasSession) {
    return "redirect_login";
  }

  const isBillingPath = pathname.startsWith("/app/billing");
  if (!isEntitled && !isBillingPath) {
    return "redirect_billing";
  }

  return "allow";
}
