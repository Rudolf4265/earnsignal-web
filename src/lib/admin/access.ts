import { fetchAdminWhoAmI } from "@/src/lib/api/admin";

const envAllowlist = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export async function checkIsAdmin(options?: { forceRefresh?: boolean }): Promise<boolean> {
  const whoami = await fetchAdminWhoAmI(options);
  if (whoami.isAdmin) {
    return true;
  }

  if (!whoami.email) {
    return false;
  }

  return envAllowlist.includes(whoami.email.toLowerCase());
}
