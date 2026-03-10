type DashboardSectionHeaderProps = {
  title: string;
  description?: string;
};

export function DashboardSectionHeader({ title, description }: DashboardSectionHeaderProps) {
  return (
    <header>
      <h2 className="text-2xl font-semibold tracking-tight text-brand-text-primary">{title}</h2>
      {description ? <p className="mt-1 text-sm text-brand-text-secondary">{description}</p> : null}
    </header>
  );
}
