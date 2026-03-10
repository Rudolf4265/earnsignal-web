type DashboardSectionHeaderProps = {
  title: string;
  description?: string;
};

export function DashboardSectionHeader({ title, description }: DashboardSectionHeaderProps) {
  return (
    <header>
      <h2 className="text-[1.7rem] font-semibold leading-tight tracking-tight text-brand-text-primary">{title}</h2>
      {description ? <p className="mt-1.5 text-sm leading-relaxed text-brand-text-secondary">{description}</p> : null}
    </header>
  );
}
