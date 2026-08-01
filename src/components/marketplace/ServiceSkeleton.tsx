"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ServiceSkeleton() {
  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden flex flex-col h-full">
      <div className="relative aspect-video bg-slate-50">
        <Skeleton className="w-full h-full" />
      </div>

      <div className="p-3 flex flex-col flex-1 gap-2">
        <Skeleton className="h-3 w-20" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-2.5 w-2.5 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-3 w-6" />
        </div>

        <div className="mt-auto space-y-3">
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>

          <Skeleton className="h-[44px] w-full rounded-[12px]" />
        </div>
      </div>
    </div>
  );
}

export function ServiceGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-5">
      {[...Array(count)].map((_, i) => (
        <ServiceSkeleton key={i} />
      ))}
    </div>
  );
}
