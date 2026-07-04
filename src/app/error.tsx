"use client";

import { useEffect } from "react";
import ErrorState from "@/components/common/ErrorState";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary caught:", error);

    // If it's a ChunkLoadError, it's likely due to a new deployment.
    // A hard reload will fetch the latest assets.
    if (
      error.message.includes("Loading chunk") ||
      error.message.includes("ChunkLoadError")
    ) {
      console.warn("ChunkLoadError detected, performing hard reload...");
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <ErrorState
        title="Application Error"
        message="Something went wrong while loading this page. This could be due to a new update."
        onRetry={() => reset()}
      />
    </div>
  );
}
