import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Requests Skeleton */}
          <div className="h-48 w-full rounded-2xl shimmer" />

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-card border border-border p-5 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>

          {/* Chart Skeleton */}
          <div className="h-[400px] w-full rounded-2xl bg-card border border-border p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="flex-1 w-full shimmer rounded-xl" />
          </div>

          {/* Table Skeleton */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border">
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Widgets Skeleton */}
        <div className="space-y-6">
          <div className="h-64 w-full rounded-2xl bg-card border border-border p-6 space-y-4">
             <Skeleton className="h-5 w-24" />
             <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2">
                   <Skeleton className="h-3 w-16" />
                   <Skeleton className="h-3 w-24" />
                </div>
             </div>
             <div className="space-y-2">
                <div className="flex justify-between"><Skeleton className="h-2 w-10" /><Skeleton className="h-2 w-10" /></div>
                <div className="h-1.5 w-full rounded-full shimmer" />
             </div>
             <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="h-80 w-full rounded-2xl bg-card border border-border p-6 space-y-6">
             <Skeleton className="h-5 w-32" />
             <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-2xl" />
                <div className="space-y-2">
                   <Skeleton className="h-4 w-16" />
                   <Skeleton className="h-3 w-32" />
                </div>
             </div>
             <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between"><Skeleton className="h-2 w-20" /><Skeleton className="h-2 w-8" /></div>
                    <div className="h-1.5 w-full rounded-full shimmer" />
                  </div>
                ))}
             </div>
          </div>
          <div className="h-48 w-full rounded-2xl shimmer" />
        </div>
      </div>
    </div>
  );
}
