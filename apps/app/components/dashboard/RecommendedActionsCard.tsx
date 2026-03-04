import { panelClassName } from "./dashboardStyles";

const actions = [
  "Upload latest exports to initialize baseline trend analysis.",
  "Reconnect sources monthly to keep quality high.",
  "Review generated reports and share findings with GTM leads.",
  "Track changes over time to verify actions improve net revenue.",
];

export function RecommendedActionsCard() {
  return (
    <section className={panelClassName}>
      <h2 className="text-2xl font-semibold text-white">Recommended Actions</h2>
      <ul className="mt-4 space-y-3 text-sm text-white/85">
        {actions.map((action) => (
          <li key={action} className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <span className="mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-blue-300" aria-hidden />
            <span>{action}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
