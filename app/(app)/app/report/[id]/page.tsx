import { AppShell } from "../../../_components/app-shell";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AppShell title={`Report ${id}`}>
      <p className="text-zinc-300">Report details for this analysis are being prepared.</p>
    </AppShell>
  );
}
