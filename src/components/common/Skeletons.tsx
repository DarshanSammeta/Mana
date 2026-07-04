import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export function VendorCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden border border-gray-200 shadow-sm flex flex-col">
      <Skeleton className="aspect-square w-full" />
      <CardContent className="p-4 flex-1">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-4" />
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-3 w-3 rounded-full" />
          ))}
          <Skeleton className="h-3 w-8 ml-1" />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 border-t border-gray-100 flex justify-between items-center">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-8 w-24" />
      </CardFooter>
    </Card>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="bg-white p-5 shadow-sm flex flex-col h-full border border-gray-200">
      <Skeleton className="h-7 w-3/4 mb-4" />
      <div className="grid grid-cols-2 gap-3 flex-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col">
            <Skeleton className="aspect-square w-full mb-1" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
      <Skeleton className="h-4 w-1/3 mt-4" />
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <section className="relative w-full h-[250px] md:h-[600px] overflow-hidden bg-gray-200">
      <Skeleton className="w-full h-full" />
    </section>
  );
}

export function HorizontalSectionSkeleton() {
  return (
    <div className="bg-white p-6 shadow-sm border border-gray-200 w-full">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex gap-6 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-[160px] flex-shrink-0">
            <Skeleton className="aspect-square w-full mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-3 w-1/2 mb-2" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GridSectionSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex flex-col">
          <Skeleton className="aspect-square w-full mb-3" />
          <Skeleton className="h-3 w-1/3 mb-1" />
          <Skeleton className="h-5 w-2/3 mb-1" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export function VendorProfileSkeleton() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="h-16 bg-white border-b border-gray-100 w-full" />
      <div className="bg-slate-50 h-12 w-full border-b border-slate-100" />
      <main className="max-w-[1500px] mx-auto w-full px-4 lg:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-9 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-9 gap-10">
              <div className="lg:col-span-6 flex gap-6">
                <div className="hidden md:flex flex-col gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="w-24 h-24 rounded-xl" />
                  ))}
                </div>
                <Skeleton className="flex-1 aspect-[3/2] rounded-3xl" />
              </div>
              <div className="lg:col-span-3 space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-8 w-1/2" />
                </div>
                <div className="pt-6 border-t border-slate-100 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </div>
            <div className="pt-12 border-t border-slate-100">
              <Skeleton className="h-64 w-full rounded-[2.5rem]" />
            </div>
          </div>
          <div className="lg:col-span-3 space-y-6">
            <Skeleton className="h-80 w-full rounded-[2.5rem]" />
            <Skeleton className="h-32 w-full rounded-[2.5rem]" />
          </div>
        </div>
      </main>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1500px] mx-auto px-4 h-16 flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>
      <main className="max-w-[1500px] mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-[400px] w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      </main>
    </div>
  );
}

