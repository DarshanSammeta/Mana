import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface VendorCardSkeletonProps {
  viewMode?: "grid" | "list";
}

export function VendorCardSkeleton({ viewMode = "grid" }: VendorCardSkeletonProps) {
  if (viewMode === "list") {
    return (
      <div className="flex flex-col md:flex-row bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="w-full md:w-64 h-64 md:h-auto shimmer shrink-0" />
        <div className="flex-1 p-4 md:p-6 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="space-y-3 pt-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
          <div className="w-full md:w-56 space-y-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
            <div className="space-y-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-8 w-3/4" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-full shadow-sm">
      <div className="aspect-[4/3] shimmer" />
      <div className="p-4 flex flex-col flex-1 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex justify-between items-center mt-auto pt-4 border-t border-border">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}
