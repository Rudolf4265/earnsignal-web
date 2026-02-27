import { SkeletonBlock } from "../../_components/ui/skeleton";

export default function ReportLoading() {
  return (
    <div className="space-y-4">
      <SkeletonBlock className="h-8 w-40" />
      <SkeletonBlock className="h-5 w-80 max-w-full" />
      <SkeletonBlock className="h-12 w-48" />
    </div>
  );
}
