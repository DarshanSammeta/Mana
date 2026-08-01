"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ServiceCard } from "./ServiceCard";
import { ServiceGridSkeleton } from "./ServiceSkeleton";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceGridProps {
  services: any[];
  isLoading: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage: () => void;
  viewMode?: "grid" | "list";
}

export function ServiceGrid({
  services,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  viewMode = "grid"
}: ServiceGridProps) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "400px",
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading && services.length === 0) {
    return <ServiceGridSkeleton />;
  }

  return (
    <div className="space-y-12">
      <motion.div
        layout
        className={cn(
          "grid gap-4 md:gap-6",
          viewMode === "grid"
            ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
            : "grid-cols-1"
        )}
      >
        <AnimatePresence mode="popLayout">
          {services.map((service, i) => (
            <ServiceCard
              key={`${service.id}-${i}`}
              service={service}
              index={i % 12} // For staggered animation in pages
              priority={i < 4}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {hasNextPage && (
        <div ref={ref} className="flex flex-col items-center justify-center pt-12 pb-24 gap-4">
          <div className="h-px w-full bg-slate-100 relative">
             <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">End of Page</span>
             </div>
          </div>
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            variant="ghost"
            className="rounded-full px-12 h-14 font-black uppercase tracking-widest text-[11px] text-blue-600 hover:bg-blue-50/50 min-w-[280px]"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading More Results...
              </>
            ) : (
              "Load More Services"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
