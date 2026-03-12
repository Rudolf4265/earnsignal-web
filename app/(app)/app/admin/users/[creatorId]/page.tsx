"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { GateLoadingShell, NotAuthorizedCallout } from "@/app/(app)/_components/gate-callouts";
import { useAppGate } from "@/app/(app)/_components/app-gate-provider";
import {
  AdminUserDetail,
  deleteAdminUser,
  fetchAdminUserDetail,
  updateAdminUserArchived,
  updateAdminUserBlocked,
  updateAdminUserCompUntil,
} from "@/src/lib/api/admin";
import { AdminEntitlementSourceBadge } from "@/src/components/ui/admin-entitlement-source-badge";
import { ErrorBanner } from "@/src/components/ui/error-banner";
import { isApiError } from "@/src/lib/api/client";
import { deriveAdminRenderState } from "@/src/lib/gating/admin-guard";

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "-";
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
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
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
        setLastUpdated(data.lastUpdatedAt ?? data.fetchedAtIso);
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

  const emailHeadline = useMemo(() => {
    if (!user) {
      return creatorId;
    }
    return user.email ?? "No email on record";
  }, [creatorId, user]);

  if (adminRenderState === "loading") {
    return <div data-testid="admin-loading"><GateLoadingShell /></div>;
  }

  if (adminRenderState === "not_authorized") {
    return <NotAuthorizedCallout testId="admin-not-authorized" />;
  }

  if (isLoading) {
    return <p className="text-sm text-gray-300">Loading user details...</p>;
  }

  if (!user) {
    return <ErrorBanner title="Could not load user" message={error?.message ?? "User not found."} requestId={error?.requestId} />;
  }
  const isDeleted = Boolean(user.deletedAt);
  const deletePhrase = `DELETE ${user.creatorId}`;
  const deletePhraseValid = deleteConfirmText.trim() === deletePhrase;

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs text-gray-400">Admin user detail</p>
          <h1 className="text-2xl font-semibold">{emailHeadline}</h1>
          <p className="font-mono text-xs text-gray-400">{user.creatorId}</p>
        </div>
        <Link href="/app/admin" className="text-sm text-blue-300 hover:text-blue-200">
          Back to list
        </Link>
      </div>

      {error ? <ErrorBanner title="Admin action failed" message={error.message} requestId={error.requestId} /> : null}
      <p className="text-xs text-gray-400">Last updated: {formatTimestamp(lastUpdated)}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-lg font-medium">Identity</h2>
          <p className="text-sm">Email: {user.email ?? "No email on record"}</p>
          <p className="font-mono text-xs text-gray-300">Creator ID: {user.creatorId}</p>
          <p className="text-sm">Created: {formatTimestamp(user.createdAt)}</p>
        </article>

        <article className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-lg font-medium">Entitlement</h2>
          <p className="text-sm">Effective plan: {user.plan ?? "none"}</p>
          <div className="flex items-center gap-2 text-sm">
            <span>Source:</span>
            <AdminEntitlementSourceBadge source={user.entitlementSource} accessReasonCode={user.accessReasonCode} />
          </div>
          <p className="text-sm">Status: {user.status ?? "unknown"}</p>
          <p className="text-sm">Blocked: {user.blocked ? "Yes" : "No"}</p>
          <p className="text-sm">Archived: {user.archived ? "Yes" : "No"}</p>
          <p className="text-sm">Deleted: {user.deletedAt ? formatTimestamp(user.deletedAt) : "No"}</p>
          <p className="text-sm">Comp until / override end: {user.compUntil ? formatTimestamp(user.compUntil) : "-"}</p>
          <p className="text-sm">Access reason: {user.accessReasonCode ?? "-"}</p>
        </article>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <h2 className="text-lg font-medium">Actions</h2>

        <button
          disabled={isSaving || isDeleted}
          className="rounded-lg bg-white/15 px-4 py-2 text-sm hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
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
        {isDeleted ? <p className="text-xs text-amber-300">Lifecycle actions are locked for deleted users.</p> : null}

        <button
          disabled={isSaving || isDeleted}
          className="rounded-lg bg-white/15 px-4 py-2 text-sm hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={async () => {
            if (isSaving || !user || isDeleted) {
              return;
            }

            const nextArchived = !user.archived;
            const confirmed = nextArchived
              ? window.confirm("Archive this user? They will be hidden from the default admin list.")
              : window.confirm("Unarchive this user and restore them to the default admin list?");
            if (!confirmed) {
              return;
            }

            setError(null);
            setIsSaving(true);
            try {
              const updated = await updateAdminUserArchived(user.creatorId, { archived: nextArchived });
              setUser(updated);
              setCompUntilDraft(updated.compUntil ?? "");
              setLastUpdated(updated.lastUpdatedAt ?? new Date().toISOString());
            } catch (err) {
              setError({ message: err instanceof Error ? err.message : "Failed to update archive state.", requestId: isApiError(err) ? err.requestId : undefined });
            } finally {
              setIsSaving(false);
            }
          }}
        >
          {user.archived ? "Unarchive user" : "Archive user"}
        </button>

        <form
          className="flex flex-wrap items-center gap-3"
          onSubmit={async (event) => {
            event.preventDefault();

            if (isSaving || !user || isDeleted) {
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
            disabled={isDeleted}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
          />
          <button disabled={isSaving || isDeleted} className="rounded-lg bg-white/15 px-4 py-2 text-sm hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60">
            Save comp_until
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 space-y-3">
        <h2 className="text-lg font-medium text-rose-100">Danger zone</h2>
        <p className="text-xs text-rose-200/80">
          Delete uses a guarded tombstone strategy. Related billing, upload, and report records are preserved; the user is blocked and hidden from default admin listings.
        </p>
        <p className="text-xs text-rose-200/80">Type <span className="font-mono">{deletePhrase}</span> to enable delete.</p>
        <input
          value={deleteConfirmText}
          onChange={(event) => setDeleteConfirmText(event.target.value)}
          placeholder={deletePhrase}
          className="w-full rounded-lg border border-rose-300/30 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-rose-200/60"
          disabled={isSaving || isDeleted}
        />
        <input
          value={deleteReason}
          onChange={(event) => setDeleteReason(event.target.value)}
          placeholder="Delete reason (optional)"
          className="w-full rounded-lg border border-rose-300/30 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-rose-200/60"
          disabled={isSaving || isDeleted}
        />
        <button
          disabled={isSaving || isDeleted || !deletePhraseValid}
          className="rounded-lg bg-rose-500/70 px-4 py-2 text-sm text-white hover:bg-rose-500/80 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={async () => {
            if (isSaving || !user || isDeleted || !deletePhraseValid) {
              return;
            }
            if (!window.confirm("Delete this user? This action is intended for final admin cleanup and cannot be undone in the UI.")) {
              return;
            }

            setError(null);
            setIsSaving(true);
            try {
              const updated = await deleteAdminUser(user.creatorId, { confirmation: "DELETE", reason: deleteReason.trim() || null });
              setUser(updated);
              setCompUntilDraft(updated.compUntil ?? "");
              setLastUpdated(updated.lastUpdatedAt ?? new Date().toISOString());
            } catch (err) {
              setError({ message: err instanceof Error ? err.message : "Failed to delete user.", requestId: isApiError(err) ? err.requestId : undefined });
            } finally {
              setIsSaving(false);
            }
          }}
        >
          {isDeleted ? "User deleted" : "Delete user"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
          <h2 className="text-lg font-medium">Latest upload</h2>
          <p className="text-sm">ID: {user.latestUpload?.id ?? "-"}</p>
          <p className="text-sm">Status: {user.latestUpload?.status ?? "-"}</p>
          <p className="text-sm">Created: {formatTimestamp(user.latestUpload?.createdAt ?? null)}</p>
          <p className="text-sm">Ready: {formatTimestamp(user.latestUpload?.readyAt ?? null)}</p>
          <p className="text-sm">Failure: {user.latestUpload?.failedReason ?? "-"}</p>
          {user.latestUpload?.link ? (
            <a href={user.latestUpload.link} className="text-sm text-blue-300 hover:text-blue-200">
              Open upload
            </a>
          ) : null}
        </article>

        <article className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
          <h2 className="text-lg font-medium">Latest report</h2>
          <p className="text-sm">ID: {user.latestReport?.id ?? "-"}</p>
          <p className="text-sm">Status: {user.latestReport?.status ?? "-"}</p>
          <p className="text-sm">Created: {formatTimestamp(user.latestReport?.createdAt ?? null)}</p>
          <p className="text-sm">Finished: {formatTimestamp(user.latestReport?.finishedAt ?? null)}</p>
          <p className="text-sm">Failure code: {user.latestReport?.failureCode ?? "-"}</p>
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
