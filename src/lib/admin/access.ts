import { getSession } from "@/src/lib/supabase/session";

const envAllowlist = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

function isTruthyAdminClaim(value: unknown): boolean {
  if (value === true) {
    return true;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "admin";
  }

  return false;
}

function hasAdminClaims(metadata: Record<string, unknown> | undefined): boolean {
  if (!metadata) {
    return false;
  }

  return [metadata.is_admin, metadata.isAdmin, metadata.admin, metadata.role].some(isTruthyAdminClaim);
}

export async function checkIsAdmin(): Promise<boolean> {
  try {
    const { data } = await getSession();
    const user = data.session?.user;

    if (!user) {
      return false;
    }

    // SECURITY: Only trust app_metadata for admin claims.
    // user_metadata is user-writable in Supabase and must never be used
    // for authorization decisions (privilege escalation risk).
    if (hasAdminClaims(user.app_metadata as Record<string, unknown> | undefined)) {
      return true;
    }

    const email = user.email?.toLowerCase();
    return email ? envAllowlist.includes(email) : false;
  } catch {
    return false;
  }
}
