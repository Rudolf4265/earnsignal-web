export type AdminStatus = "unknown" | "admin" | "not_admin";

export type AdminRenderState = "loading" | "not_authorized" | "authorized";

export function deriveAdminRenderState(params: {
  isGateLoading: boolean;
  adminStatus: AdminStatus;
}): AdminRenderState {
  const { isGateLoading, adminStatus } = params;

  if (isGateLoading || adminStatus === "unknown") {
    return "loading";
  }

  if (adminStatus === "not_admin") {
    return "not_authorized";
  }

  return "authorized";
}
