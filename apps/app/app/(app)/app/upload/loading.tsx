import { SkeletonBlock } from "../../_components/ui/skeleton";

export default function UploadLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <SkeletonBlock className="h-9 w-52" />
      <SkeletonBlock className="h-6 w-96 max-w-full" />
      <div className="grid gap-6 lg:grid-cols-3">
        <SkeletonBlock className="h-96 lg:col-span-2" />
        <SkeletonBlock className="h-96" />
      </div>
    </div>
  );
}
