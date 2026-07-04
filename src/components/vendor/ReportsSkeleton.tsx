import { Skeleton } from "@/components/ui/skeleton";

export function ReportsSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b border-border pb-6">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Report Selection Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-4 w-40" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-full flex items-center justify-between p-4 rounded-2xl border border-border bg-card">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-4" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Configuration Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-3xl p-8 space-y-8">
            <div className="space-y-4">
              <Skeleton className="h-4 w-48" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Skeleton className="h-2 w-10" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-2 w-10" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-20 rounded-lg" />)}
              </div>
            </div>

            <div className="pt-8 border-t border-border space-y-4">
              <Skeleton className="h-4 w-40" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-28 rounded-2xl border border-border bg-card flex flex-col items-center justify-center gap-2">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-2 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex gap-4">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-2 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
