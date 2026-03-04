const features = [
  {
    title: "Stability Index",
    description: "Quantify revenue concentration and long-term resilience.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-300" aria-hidden>
        <path d="M12 3 5 6v6c0 4.6 3 8.7 7 9.9 4-1.2 7-5.3 7-9.9V6l-7-3Z" fill="currentColor" />
        <path d="m9.5 12 1.9 1.9 3.6-3.8" fill="none" stroke="#DBEAFE" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Churn Velocity",
    description: "Track the pace of subscriber loss before it impacts growth.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-yellow-300" aria-hidden>
        <path d="M13 2 5 13h6l-1 9 9-13h-6l0-7Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Tier Migration Analysis",
    description: "Understand movement between pricing tiers and lifecycle health.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-teal-300" aria-hidden>
        <rect x="3" y="4" width="18" height="6" rx="1.5" fill="currentColor" />
        <rect x="3" y="14" width="11" height="6" rx="1.5" fill="currentColor" opacity="0.9" />
        <path d="M15 17h6" stroke="#99F6E4" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function FeatureCards() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-10">
      <div className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_0_30px_rgba(59,130,246,0.10)]"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/10">
              {feature.icon}
            </span>
            <h3 className="mt-3 text-base font-semibold text-white">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/65">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
