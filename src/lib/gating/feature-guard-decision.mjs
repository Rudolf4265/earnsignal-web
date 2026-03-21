/**
 * @typedef {"upload"|"report"} GuardedFeature
 * @typedef {import("./app-gate").AppGateState} AppGateState
 * @typedef {{ kind: "render_children" } | { kind: "redirect", href: string } | { kind: "render_loading" } | { kind: "render_session_expired" } | { kind: "render_not_entitled" } | { kind: "render_entitlements_error" }} FeatureGuardOutcome
 */

/**
 * @param {{ gateState: AppGateState; pathname: string; feature: GuardedFeature }} params
 * @returns {FeatureGuardOutcome}
 */
export function decideFeatureGuardOutcome({ gateState, pathname }) {
  switch (gateState) {
    case "anon":
      return { kind: "redirect", href: `/login?returnTo=${encodeURIComponent(pathname)}` };
    case "session_loading":
    case "authed_loading_entitlements":
      return { kind: "render_loading" };
    case "session_expired":
      return { kind: "render_session_expired" };
    case "entitlements_error":
      return { kind: "render_entitlements_error" };
    case "authed_unentitled":
      if (
        pathname.startsWith("/app/billing") ||
        pathname.startsWith("/app/settings") ||
        pathname.startsWith("/app/data") ||
        pathname.startsWith("/app/report")
      ) {
        return { kind: "render_children" };
      }

      return {
        kind: "redirect",
        href: `/app/billing?reason=upgrade_required&from=${encodeURIComponent(pathname)}`,
      };
    case "authed_entitled":
      return { kind: "render_children" };
    default:
      return { kind: "render_entitlements_error" };
  }
}
