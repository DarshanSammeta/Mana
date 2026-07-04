"use client";

import VendorSidebar from "@/components/vendor/VendorSidebar";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (user.role !== "VENDOR") {
      router.push("/");
    }
  }, [user, router]);

  if (!user || user.role !== "VENDOR") {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="flex-1 flex min-h-0">
        <div className="hidden lg:block w-72 border-r border-border bg-white sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
           <VendorSidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <main className="p-8 w-full max-w-7xl mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
