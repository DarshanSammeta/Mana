"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function CustomerDashboardSkeleton() {
  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 md:w-80" />
          <Skeleton className="h-5 w-48 md:w-60" />
        </div>
        <div className="w-full md:w-64 h-24 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
           <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                 <Skeleton className="h-3 w-20" />
                 <Skeleton className="h-6 w-32" />
              </div>
           </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-44 bg-white border border-slate-200 p-6 rounded-2xl">
            <Skeleton className="h-12 w-12 rounded-xl mb-4" />
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3 mt-1" />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-8 md:gap-12 border-t border-slate-100 pt-8 md:pt-12">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-8 md:space-y-10">
           <section>
              <div className="flex items-center justify-between mb-8">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-20" />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="border border-slate-200 rounded-2xl p-5 flex gap-5 bg-white">
                      <Skeleton className="h-20 w-20 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-3">
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="flex justify-between pt-2">
                           <Skeleton className="h-6 w-24" />
                           <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                  </div>
                ))}
              </div>
           </section>

           <Skeleton className="h-48 w-full rounded-3xl" />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <Skeleton className="h-6 w-32 mb-8" />
              <div className="space-y-6">
                 {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-4">
                       <Skeleton className="h-16 w-16 rounded-xl shrink-0" />
                       <div className="flex-1 space-y-2">
                          <div className="flex justify-between">
                             <Skeleton className="h-3 w-12" />
                             <Skeleton className="h-3 w-10" />
                          </div>
                          <Skeleton className="h-4 w-full" />
                          <div className="flex justify-between pt-1">
                             <Skeleton className="h-3 w-16" />
                             <Skeleton className="h-3 w-16" />
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
