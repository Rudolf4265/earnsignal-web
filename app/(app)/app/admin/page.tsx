"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { checkIsAdmin } from "@/src/lib/admin/access";
import { AdminUserRow, fetchAdminUsers } from "@/src/lib/api/admin";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        const allowed = await checkIsAdmin();

        if (!isMounted) {
          return;
        }

        if (!allowed) {
          window.location.replace("/app");
          return;
        }

        setIsAdmin(true);
        const result = await fetchAdminUsers(query);

        if (!isMounted) {
          return;
        }

        setUsers(result.users);
        setError(null);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setError(err instanceof Error ? err.message : "Failed to load admin users.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [query]);

  const totalText = useMemo(() => `${users.length} user${users.length === 1 ? "" : "s"}`, [users.length]);

  if (!isAdmin && isLoading) {
    return <p className="text-sm text-gray-300">Validating admin access…</p>;
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Admin console</h1>
        <p className="text-sm text-gray-300">Internal support tools for account state and upload/report health.</p>
      </header>

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
          placeholder="Search email or creator id"
          className="w-full max-w-md rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
        />
        <button type="submit" className="rounded-lg bg-white/15 px-4 py-2 text-sm hover:bg-white/20">
          Search
        </button>
      </form>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 text-xs text-gray-400">{totalText}</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-gray-300">
              <tr>
                <th className="px-2 py-2 font-medium">Email</th>
                <th className="px-2 py-2 font-medium">Creator ID</th>
                <th className="px-2 py-2 font-medium">Plan / Status</th>
                <th className="px-2 py-2 font-medium">Blocked</th>
                <th className="px-2 py-2 font-medium">Comp until</th>
                <th className="px-2 py-2 font-medium">Last upload</th>
                <th className="px-2 py-2 font-medium">Inspect</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.creatorId} className="border-t border-white/10">
                  <td className="px-2 py-2">{user.email ?? "—"}</td>
                  <td className="px-2 py-2 font-mono text-xs">{user.creatorId}</td>
                  <td className="px-2 py-2">{`${user.plan ?? "none"} / ${user.status ?? "unknown"}`}</td>
                  <td className="px-2 py-2">{user.blocked ? "Yes" : "No"}</td>
                  <td className="px-2 py-2">{user.compUntil ?? "—"}</td>
                  <td className="px-2 py-2">{user.uploadState ?? "—"}</td>
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
    </section>
  );
}
