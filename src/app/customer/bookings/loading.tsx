import { Skeleton } from "@/components/ui/skeleton";

export default function BookingsLoading() {
  return (
    <div className="max-w-[1200px] mx-auto space-y-6 py-6 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-full md:w-72" />
      </div>

      <div className="border-b border-border pb-3">
        <div className="flex gap-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-5 w-24" />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border border-border rounded-xl overflow-hidden bg-card">
            <div className="bg-muted/30 px-6 py-3 border-b border-border/50 flex items-center justify-between">
              <div className="flex gap-6">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="p-6 flex gap-6">
              <Skeleton className="h-20 w-20 rounded-lg" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="space-y-3 flex flex-col items-end">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
