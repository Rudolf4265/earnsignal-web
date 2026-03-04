export function AboutTeaser() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-8 pb-16 relative">
      <div className="absolute right-8 top-2 hidden h-44 w-72 overflow-hidden rounded-3xl border border-cyan-300/10 md:block">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_10%,rgba(56,189,248,0.15)_48%,transparent_85%)]" />
      </div>
      <h2 className="text-2xl font-semibold text-white">About EarnSigma</h2>
      <h3 className="mt-3 text-lg font-semibold text-white/90">Revenue has structure. We measure it.</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/65 max-w-2xl">
        EarnSigma is built for creators who demand deep insight into their revenue dynamics. Our
        platform is designed to empower you with clarity and strategic growth through data-driven
        structure.
      </p>
    </section>
  );
}
