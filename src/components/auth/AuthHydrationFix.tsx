"use client";

import { useEffect, useState } from "react";

export default function AuthHydrationFix({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // This will run only once after the component mounts on the client
    // useAuthStore.persist.rehydrate() is not strictly needed if we just wait for mount
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return null; // or a basic non-auth version of your layout
  }

  return <>{children}</>;
}
