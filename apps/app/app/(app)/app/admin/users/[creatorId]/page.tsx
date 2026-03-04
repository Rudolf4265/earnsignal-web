"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GateLoadingShell, NotAuthorizedCallout } from "@/app/(app)/_components/gate-callouts";
import { useAppGate } from "@/app/(app)/_components/app-gate-provider";
import { AdminUserDetail, fetchAdminUserDetail, updateAdminUserBlocked, updateAdminUserCompUntil } from "@/src/lib/api/admin";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { isApiError } from "@/src/lib/api/client";
import { deriveAdminRenderState } from "@/src/lib/gating/admin-guard";

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function AdminUserDetailPage() {
  const params = useParams<{ creatorId: string }>();
  const creatorId = params.creatorId;

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [compUntilDraft, setCompUntilDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<{ message: string; requestId?: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { isLoading: isGateLoading, adminStatus } = useAppGate();
  const adminRenderState = deriveAdminRenderState({ isGateLoading, adminStatus });
  const isAdmin = adminRenderState === "authorized";

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const load = async () => {
      try {
        setIsLoading(true);

        const data = await fetchAdminUserDetail(creatorId);
        if (!isMounted) {
          return;
        }

        setUser(data);
        setCompUntilDraft(data.compUntil ?? "");
        setLastUpdated(data.fetchedAtIso);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setError({ message: err instanceof Error ? err.message : "Failed to load user.", requestId: isApiError(err) ? err.requestId : undefined });
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
  }, [creatorId, isAdmin]);

  const headerText = useMemo(() => {
    if (!user) {
      return creatorId;
    }

    return user.email ? `${user.email} (${user.creatorId})` : user.creatorId;
  }, [creatorId, user]);

  if (adminRenderState === "loading") {
    return <div data-testid="admin-loading"><GateLoadingShell /></div>;
  }

  if (adminRenderState === "not_authorized") {
    return <NotAuthorizedCallout testId="admin-not-authorized" />;
  }

  if (isLoading) {
    return <p className="text-sm text-gray-300">Loading user details…</p>;
  }

  if (!user) {
    return <ErrorBanner title="Could not load user" message={error?.message ?? "User not found."} requestId={error?.requestId} />;
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Admin user detail</p>
          <h1 className="text-xl font-semibold">{headerText}</h1>
        </div>
        <Link href="/app/admin" className="text-sm text-blue-300 hover:text-blue-200">
          Back to list
        </Link>
      </div>

      {error ? <ErrorBanner title="Admin action failed" message={error.message} requestId={error.requestId} /> : null}
      <p className="text-xs text-gray-400">Last updated: {formatTimestamp(lastUpdated)}</p>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <p className="text-sm">Plan: {user.plan ?? "none"}</p>
        <p className="text-sm">Status: {user.status ?? "unknown"}</p>
        <p className="text-sm">Blocked: {user.blocked ? "Yes" : "No"}</p>
        <p className="text-sm">Comp until: {user.compUntil ?? "—"}</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <h2 className="text-lg font-medium">Actions</h2>

        <button
          disabled={isSaving}
          className="rounded-lg bg-white/15 px-4 py-2 text-sm hover:bg-white/20 disabled:opacity-60"
          onClick={async () => {
            if (isSaving || !user) {
              return;
            }

            const nextBlocked = !user.blocked;
            if (nextBlocked && !window.confirm("Block this user? They will lose access until unblocked.")) {
              return;
            }

            const previous = user;
            setError(null);
            setIsSaving(true);
            setUser({ ...previous, blocked: nextBlocked });

            try {
              const updated = await updateAdminUserBlocked(user.creatorId, nextBlocked);
              setUser((current) => (current ? { ...current, ...updated } : current));
              setLastUpdated(new Date().toISOString());
            } catch (err) {
              setUser(previous);
              setError({ message: err instanceof Error ? err.message : "Failed to update blocked status.", requestId: isApiError(err) ? err.requestId : undefined });
            } finally {
              setIsSaving(false);
            }
          }}
        >
          {user.blocked ? "Unblock user" : "Block user"}
        </button>

        <form
          className="flex flex-wrap items-center gap-3"
          onSubmit={async (event) => {
            event.preventDefault();

            if (isSaving || !user) {
              return;
            }

            const trimmed = compUntilDraft.trim();
            const normalized = trimmed.length === 0 ? null : trimmed;
            const previous = user;

            setError(null);
            setIsSaving(true);
            setUser({ ...previous, compUntil: normalized });

            try {
              const updated = await updateAdminUserCompUntil(user.creatorId, normalized);
              setUser((current) => (current ? { ...current, ...updated } : current));
              setCompUntilDraft(updated.compUntil ?? "");
              setLastUpdated(new Date().toISOString());
            } catch (err) {
              setUser(previous);
              setCompUntilDraft(previous.compUntil ?? "");
              setError({ message: err instanceof Error ? err.message : "Failed to update comp_until.", requestId: isApiError(err) ? err.requestId : undefined });
            } finally {
              setIsSaving(false);
            }
          }}
        >
          <input
            value={compUntilDraft}
            onChange={(event) => setCompUntilDraft(event.target.value)}
            type="datetime-local"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
          />
          <button disabled={isSaving} className="rounded-lg bg-white/15 px-4 py-2 text-sm hover:bg-white/20 disabled:opacity-60">
            Save comp_until
          </button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
          <h2 className="text-lg font-medium">Latest upload</h2>
          <p className="text-sm">Status: {user.latestUpload?.status ?? "—"}</p>
          <p className="text-sm">Created: {formatTimestamp(user.latestUpload?.createdAt ?? null)}</p>
          {user.latestUpload?.link ? (
            <a href={user.latestUpload.link} className="text-sm text-blue-300 hover:text-blue-200">
              Open upload
            </a>
          ) : null}
        </article>

        <article className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
          <h2 className="text-lg font-medium">Latest report</h2>
          <p className="text-sm">Status: {user.latestReport?.status ?? "—"}</p>
          <p className="text-sm">Created: {formatTimestamp(user.latestReport?.createdAt ?? null)}</p>
          {user.latestReport?.link ? (
            <a href={user.latestReport.link} className="text-sm text-blue-300 hover:text-blue-200">
              Open report
            </a>
          ) : null}
        </article>
      </div>
    </section>
  );
}
