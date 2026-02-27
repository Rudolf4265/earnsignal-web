import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
      <h1 className="text-2xl font-semibold text-white">Checkout canceled</h1>
      <p className="text-sm text-gray-300">No worries — your billing status has not changed.</p>
      <Link href="/app/billing" className="inline-flex rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/5">
        Back to billing
      </Link>
    </div>
  );
}
