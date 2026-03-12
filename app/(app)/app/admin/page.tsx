"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { GateLoadingShell, NotAuthorizedCallout } from "../../_components/gate-callouts";
import { useAppGate } from "../../_components/app-gate-provider";
import { AdminListMode, AdminUserRow, fetchAdminUsers, grantAdminAccessByEmail } from "@/src/lib/api/admin";
import { AdminEntitlementSourceBadge } from "@/src/components/ui/admin-entitlement-source-badge";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { isApiError } from "@/src/lib/api/client";
import { deriveAdminRenderState } from "@/src/lib/gating/admin-guard";

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

function parseLocalDateTime(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

export default function AdminUsersPage() {
  const { isLoading: isGateLoading, adminStatus } = useAppGate();
  const adminRenderState = deriveAdminRenderState({ isGateLoading, adminStatus });
  const isAdmin = adminRenderState === "authorized";
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [listMode, setListMode] = useState<AdminListMode>("search");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string; requestId?: string } | null>(null);

  const [grantEmail, setGrantEmail] = useState("");
  const [grantPlanTier, setGrantPlanTier] = useState<"A" | "B">("B");
  const [grantEndsAt, setGrantEndsAt] = useState("");
  const [grantNote, setGrantNote] = useState("");
  const [isGranting, setIsGranting] = useState(false);
  const [grantResult, setGrantResult] = useState<
    | { kind: "error"; message: string; requestId?: string }
    | {
        kind: "success";
        message: string;
        creatorId: string;
        email: string;
        source: string | null;
        accessReasonCode: string | null;
      }
    | null
  >(null);

  const loadUsers = useCallback(
    async (nextQuery: string) => {
      setIsLoading(true);
      try {
        const result = await fetchAdminUsers(nextQuery);
        setUsers(result.users);
        setListMode(result.mode);
        setError(null);
      } catch (err) {
        setError({
          message: err instanceof Error ? err.message : "Failed to load admin users.",
          requestId: isApiError(err) ? err.requestId : undefined,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [setUsers, setListMode, setError, setIsLoading],
  );

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    void loadUsers(query);
  }, [isAdmin, loadUsers, query]);

  const totalText = useMemo(() => `${users.length} user${users.length === 1 ? "" : "s"}`, [users.length]);
  const listLabel = useMemo(() => {
    if (listMode === "recent" && !query) {
      return "Recent users";
    }
    return "Search results";
  }, [listMode, query]);

  if (adminRenderState === "loading") {
    return <div data-testid="admin-loading"><GateLoadingShell /></div>;
  }

  if (adminRenderState === "not_authorized") {
    return <NotAuthorizedCallout testId="admin-not-authorized" />;
  }

  if (isLoading) {
    return <p className="text-sm text-gray-300">Loading admin users...</p>;
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Admin console</h1>
        <p className="text-sm text-gray-300">Email-first account operations for access, entitlement, and health checks.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <form
            className="flex items-center gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              setQuery(search.trim());
            }}
          >
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by email (creator ID also works)"
              className="w-full max-w-xl rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
            />
            <button type="submit" className="rounded-lg bg-white/15 px-4 py-2 text-sm hover:bg-white/20">
              Search
            </button>
          </form>

          {error ? <ErrorBanner title="Could not load admin users" message={error.message} requestId={error.requestId} /> : null}

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
              <span>{totalText}</span>
              <span>{listLabel}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-gray-300">
                  <tr>
                    <th className="px-2 py-2 font-medium">Email</th>
                    <th className="px-2 py-2 font-medium">Creator ID</th>
                    <th className="px-2 py-2 font-medium">Entitlement</th>
                    <th className="px-2 py-2 font-medium">Blocked</th>
                    <th className="px-2 py-2 font-medium">Latest upload</th>
                    <th className="px-2 py-2 font-medium">Latest report</th>
                    <th className="px-2 py-2 font-medium">Updated</th>
                    <th className="px-2 py-2 font-medium">Inspect</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.creatorId} className="border-t border-white/10">
                      <td className="px-2 py-2">{user.email ?? "No email on record"}</td>
                      <td className="px-2 py-2 font-mono text-xs text-gray-300">{user.creatorId}</td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <span>{user.plan ?? "none"}</span>
                          <AdminEntitlementSourceBadge source={user.entitlementSource} />
                        </div>
                      </td>
                      <td className="px-2 py-2">{user.blocked ? "Yes" : "No"}</td>
                      <td className="px-2 py-2">{user.uploadState ? `${user.uploadState} (${formatTimestamp(user.uploadAt)})` : "-"}</td>
                      <td className="px-2 py-2">{user.reportState ? `${user.reportState} (${formatTimestamp(user.reportAt)})` : "-"}</td>
                      <td className="px-2 py-2">{formatTimestamp(user.lastUpdatedAt ?? user.createdAt)}</td>
                      <td className="px-2 py-2">
                        <Link className="text-blue-300 hover:text-blue-200" href={`/app/admin/users/${user.creatorId}`}>
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="space-y-1">
            <h2 className="text-lg font-medium">Grant access by email</h2>
            <p className="text-xs text-gray-400">Grant paid-equivalent access without looking up a raw creator UUID first.</p>
          </div>

          <form
            className="space-y-3"
            onSubmit={async (event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              if (isGranting) {
                return;
              }

              const normalizedEmail = grantEmail.trim().toLowerCase();
              if (!normalizedEmail) {
                setGrantResult({ kind: "error", message: "Email is required." });
                return;
              }

              const endsAtIso = parseLocalDateTime(grantEndsAt);
              if (grantEndsAt.trim() && !endsAtIso) {
                setGrantResult({ kind: "error", message: "Expiration date is invalid." });
                return;
              }

              setIsGranting(true);
              setGrantResult(null);
              try {
                const result = await grantAdminAccessByEmail({
                  email: normalizedEmail,
                  planTier: grantPlanTier,
                  endsAtIso,
                  note: grantNote.trim() || null,
                });
                setGrantResult({
                  kind: "success",
                  message: `Access granted for ${result.email ?? normalizedEmail} (${result.creatorId}).`,
                  creatorId: result.creatorId,
                  email: result.email ?? normalizedEmail,
                  source: result.entitlementSource,
                  accessReasonCode: result.accessReasonCode,
                });
                setGrantEmail("");
                setGrantEndsAt("");
                setGrantNote("");
                await loadUsers(query);
              } catch (err) {
                if (isApiError(err)) {
                  if (err.status === 404) {
                    setGrantResult({
                      kind: "error",
                      message: "No account found for that email.",
                      requestId: err.requestId,
                    });
                  } else if (err.status === 422) {
                    setGrantResult({
                      kind: "error",
                      message: `Validation failed: ${err.message}`,
                      requestId: err.requestId,
                    });
                  } else {
                    setGrantResult({
                      kind: "error",
                      message: err.message,
                      requestId: err.requestId,
                    });
                  }
                } else {
                  setGrantResult({
                    kind: "error",
                    message: err instanceof Error ? err.message : "Failed to grant access by email.",
                  });
                }
              } finally {
                setIsGranting(false);
              }
            }}
          >
            <label className="block space-y-1 text-xs text-gray-300">
              <span>Email</span>
              <input
                type="email"
                value={grantEmail}
                onChange={(event) => setGrantEmail(event.target.value)}
                placeholder="user@example.com"
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                required
              />
            </label>

            <label className="block space-y-1 text-xs text-gray-300">
              <span>Plan tier</span>
              <select
                value={grantPlanTier}
                onChange={(event) => setGrantPlanTier(event.target.value === "A" ? "A" : "B")}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
              >
                <option value="B">Pro (B)</option>
                <option value="A">Basic (A)</option>
              </select>
            </label>

            <label className="block space-y-1 text-xs text-gray-300">
              <span>Expiration (optional)</span>
              <input
                type="datetime-local"
                value={grantEndsAt}
                onChange={(event) => setGrantEndsAt(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
              />
            </label>

            <label className="block space-y-1 text-xs text-gray-300">
              <span>Reason note (optional)</span>
              <input
                type="text"
                value={grantNote}
                onChange={(event) => setGrantNote(event.target.value)}
                placeholder="Ticket or operator note"
                className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
              />
            </label>

            <button
              type="submit"
              disabled={isGranting}
              className="w-full rounded-lg bg-white/15 px-4 py-2 text-sm hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGranting ? "Granting..." : "Grant access"}
            </button>
          </form>

          {grantResult?.kind === "success" ? (
            <div className="space-y-2 rounded-lg border border-emerald-300/30 bg-emerald-500/10 p-3">
              <p className="text-xs text-emerald-200">{grantResult.message}</p>
              <div className="flex items-center gap-2">
                <AdminEntitlementSourceBadge source={grantResult.source} accessReasonCode={grantResult.accessReasonCode} />
                <span className="text-xs text-gray-300">{grantResult.email}</span>
              </div>
              <Link
                href={`/app/admin/users/${grantResult.creatorId}`}
                className="inline-flex items-center rounded-lg border border-sky-300/30 bg-sky-500/15 px-3 py-1.5 text-xs font-medium text-sky-100 hover:bg-sky-500/22"
              >
                Open user details
              </Link>
            </div>
          ) : null}
          {grantResult?.kind === "error" ? (
            <ErrorBanner title="Grant access failed" message={grantResult.message} requestId={grantResult.requestId} />
          ) : null}
        </aside>
      </div>
    </section>
  );
}
