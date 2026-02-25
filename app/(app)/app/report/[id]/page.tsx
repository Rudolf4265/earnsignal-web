export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Report {id}</h1>
      <p className="text-gray-400">Report details for this analysis are being prepared.</p>
    </div>
  );
}
