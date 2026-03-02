import Link from "next/link";

type EmptyStateProps = {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
};

export function EmptyState({ title, body, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
      <Link
        href={ctaHref}
        className="mt-4 inline-flex rounded-xl bg-brand-blue px-4 py-2 text-sm font-medium text-slate-900  transition hover:opacity-90"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
