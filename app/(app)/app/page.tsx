export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-gray-400 mt-2">
          High-level revenue signals and structural stability.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-white/10 bg-navy-900 p-6">
          <p className="text-sm text-gray-400">Net Revenue</p>
          <p className="text-2xl font-semibold mt-2">$—</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-navy-900 p-6">
          <p className="text-sm text-gray-400">Subscribers</p>
          <p className="text-2xl font-semibold mt-2">—</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-navy-900 p-6">
          <p className="text-sm text-gray-400">Churn Risk</p>
          <p className="text-2xl font-semibold mt-2">—</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-navy-900 p-6">
        <p className="text-sm text-gray-400">
          Connect data to populate revenue insights.
        </p>
      </div>
    </div>
  );
}
