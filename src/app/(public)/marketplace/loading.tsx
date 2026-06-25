import { Skeleton } from "@/components/ui/skeleton";

export default function MarketplaceLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-16 border-b bg-card w-full" /> {/* Navbar placeholder */}

      <div className="max-w-[1500px] mx-auto w-full px-4 py-8 flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 shrink-0 space-y-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </aside>

        <div className="flex-1 space-y-6">
          <div className="h-16 bg-card rounded-xl border border-border flex items-center px-4 justify-between">
            <Skeleton className="h-6 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-4">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
