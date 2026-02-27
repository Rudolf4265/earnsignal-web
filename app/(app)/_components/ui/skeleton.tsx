"use client";

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/10 ${className}`} />;
}

export function WorkspaceLoadingShell({
  title = "Loading workspace",
  subtitle = "Syncing your access and latest data…",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen bg-navy-950 text-white">
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden w-64 rounded-2xl border border-white/10 bg-navy-900/80 p-5 md:block">
          <SkeletonBlock className="mb-8 h-7 w-36" />
          <div className="space-y-3">
            <SkeletonBlock className="h-9 w-full" />
            <SkeletonBlock className="h-9 w-5/6" />
            <SkeletonBlock className="h-9 w-4/6" />
            <SkeletonBlock className="h-9 w-3/4" />
          </div>
        </aside>

        <main className="flex-1 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm font-medium text-gray-200">{title}</p>
          <p className="text-xs text-gray-400">{subtitle}</p>
          <SkeletonBlock className="h-24 w-full" />
          <SkeletonBlock className="h-24 w-full" />
        </main>
      </div>
    </div>
  );
}
