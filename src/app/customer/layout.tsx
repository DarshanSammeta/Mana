"use client";

import CustomerSidebar from "@/components/customer/CustomerSidebar";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  // Generate breadcrumbs from path
  const breadcrumbs = (pathname || "").split('/').filter(Boolean).map((path, index, arr) => {
    const href = `/${arr.slice(0, index + 1).join('/')}`;
    const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
    return { label, href, isLast: index === arr.length - 1 };
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-foreground selection:bg-primary/10">
      <div className="flex-1 w-full max-w-[1500px] mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">

        {/* Professional Side Navigation for Account */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm sticky top-24">
            <div className="p-5 border-b border-border bg-white">
              <h2 className="font-bold text-base text-slate-900">Account Settings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Manage your profile and bookings</p>
            </div>
            <div className="p-2">
              <CustomerSidebar />
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Breadcrumbs (Modern Style) */}
          <nav className="flex items-center gap-2 text-[13px] text-muted-foreground mb-6 px-1">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                <Link
                  href={crumb.href}
                  className={cn(
                    "hover:text-primary transition-colors",
                    crumb.isLast ? "font-semibold text-slate-900" : ""
                  )}
                >
                  {crumb.label}
                </Link>
              </div>
            ))}
          </nav>

          {/* Main Content Area */}
          <main className="bg-card border border-border rounded-2xl shadow-sm p-6 lg:p-10 flex-1">
             {children}
          </main>
        </div>
      </div>
    </div>
  );
}
