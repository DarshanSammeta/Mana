"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoadingStore } from "@/store/loadingStore";

export default function RouteLoadingHandler() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setIsLoading } = useLoadingStore();

  useEffect(() => {
    // Hide global loader when route fully changes
    setIsLoading(false);
  }, [pathname, searchParams, setIsLoading]);

  return null;
}
