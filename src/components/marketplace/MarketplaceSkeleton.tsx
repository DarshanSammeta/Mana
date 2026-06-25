import { Skeleton } from "@/components/ui/skeleton";
import { VendorCardSkeleton } from "./VendorCardSkeleton";

export function MarketplaceSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Category Selection Skeleton */}
      <div className="bg-card border-b border-border">
        <div className="max-w-[1500px] mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar Skeleton */}
        <aside className="lg:w-64 shrink-0 space-y-8">
          <div className="bg-card p-6 rounded-xl border border-border space-y-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <div className="space-y-2">
                  {[...Array(4)].map((_, j) => (
                    <Skeleton key={j} className="h-5 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content Skeleton */}
        <div className="flex-1">
          <div className="bg-card p-4 rounded-xl border border-border mb-6 flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <VendorCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
