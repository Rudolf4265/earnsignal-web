"use client";

import Link from "next/link";
import { WorkspaceLoadingShell } from "./ui/skeleton";

export function GateLoadingShell() {
  return <WorkspaceLoadingShell title="Loading workspace" subtitle="Syncing your account access and entitlements…" />;
}

export function SessionExpiredCallout({ requestId }: { requestId?: string }) {
  return (
    <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-amber-300/40 bg-amber-500/10 p-6" data-testid="gate-session-expired">
      <h2 className="text-lg font-semibold text-amber-100">Session expired</h2>
      <p className="mt-2 text-sm text-amber-100/90">Your session expired while validating workspace access. Please sign in again to continue.</p>
      {requestId ? <p className="mt-2 text-xs text-amber-200/80">Request ID: {requestId}</p> : null}
      <Link href="/login" className="mt-4 inline-flex rounded-lg border border-amber-200/60 px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-300/10">
        Sign in
      </Link>
    </div>
  );
}

export function NotEntitledCallout() {
  return (
    <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-blue-300/30 bg-blue-500/10 p-6" data-testid="gate-not-entitled">
      <h2 className="text-lg font-semibold text-blue-100">Upgrade required</h2>
      <p className="mt-2 text-sm text-blue-100/90">Your current plan does not include this feature. Continue in Billing to activate report access.</p>
      <Link href="/app/billing" className="mt-4 inline-flex rounded-lg border border-blue-200/50 px-3 py-1.5 text-xs text-blue-100 hover:bg-blue-300/10">
        Go to Billing
      </Link>
    </div>
  );
}

export function EntitlementsErrorCallout({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-rose-300/40 bg-rose-500/10 p-6" data-testid="gate-entitlements-error">
      <h2 className="text-lg font-semibold text-rose-100">Unable to verify subscription status.</h2>
      <p className="mt-2 text-sm text-rose-100/90">We could not confirm your plan access right now. Retry verification or go to Billing.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex rounded-lg border border-rose-200/60 px-3 py-1.5 text-xs text-rose-100 hover:bg-rose-300/10"
        >
          Retry
        </button>
        <Link href="/app/billing" className="inline-flex rounded-lg border border-rose-200/60 px-3 py-1.5 text-xs text-rose-100 hover:bg-rose-300/10">
          Go to Billing
        </Link>
      </div>
    </div>
  );
}

export function NotAuthorizedCallout() {
  return (
    <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-rose-300/40 bg-rose-500/10 p-6" data-testid="gate-not-authorized">
      <h2 className="text-lg font-semibold text-rose-100">Not authorized</h2>
      <p className="mt-2 text-sm text-rose-100/90">You do not have access to this admin section. Return to your dashboard.</p>
      <Link href="/app" className="mt-4 inline-flex rounded-lg border border-rose-200/60 px-3 py-1.5 text-xs text-rose-100 hover:bg-rose-300/10">
        Go to Dashboard
      </Link>
    </div>
  );
}
