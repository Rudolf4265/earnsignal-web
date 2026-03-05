import { SkeletonBlock } from "../../_components/ui/skeleton";

export default function ReportLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-40" />
        <SkeletonBlock className="h-5 w-80 max-w-full" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-slate-200 bg-white px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-4 w-40" />
                <SkeletonBlock className="h-3 w-28" />
              </div>
              <SkeletonBlock className="h-6 w-20" />
              <SkeletonBlock className="h-8 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
