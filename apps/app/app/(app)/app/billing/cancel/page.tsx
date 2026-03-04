import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Checkout canceled</h1>
      <p className="text-sm text-slate-700">No worries — your billing status has not changed.</p>
      <Link href="/app/billing" className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100">
        Back to billing
      </Link>
    </div>
  );
}
