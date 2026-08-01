"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { visibleCategories, moreCategories } from "@/config/navigation/categories";
import { quickLinks } from "@/config/navigation/subNavigation";
import { cn } from "@/lib/utils";
import { Menu, Zap } from "lucide-react";
import MoreDropdown from "./MoreDropdown";

export default function SubNavbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams?.get("category");
  const currentEventType = searchParams?.get("eventType");

  return (
    <div className="bg-white h-12 flex items-center px-4 md:px-8 shadow-sm relative border-b border-gray-100">
      <div className="max-w-[1600px] mx-auto w-full flex items-center justify-between">
        {/* Left Side: Categories */}
        <div className="flex items-center gap-8 overflow-hidden">
          <Link
            href="/marketplace"
            className="flex items-center gap-2 hover:text-purple-700 py-3 border-b-2 border-transparent hover:border-purple-600 shrink-0"
          >
            <Menu className="h-5 w-5" />
            <span className="font-bold uppercase tracking-tighter text-[13px]">All Events</span>
          </Link>

          <div className="flex items-center gap-6 overflow-hidden">
            {visibleCategories.map((name) => {
              const isActive = pathname === "/marketplace" && (currentCategory === name || currentEventType === name);
              const href = `/marketplace?eventType=${encodeURIComponent(name)}`;

              return (
                <Link
                  key={name}
                  href={href}
                  className={cn(
                    "py-3 border-b-2 transition-colors shrink-0 whitespace-nowrap text-[14px] font-medium",
                    isActive ? "text-purple-700 border-purple-600 font-semibold" : "text-slate-600 border-transparent hover:text-purple-600"
                  )}
                >
                  {name}
                </Link>
              );
            })}

            <MoreDropdown categories={moreCategories} currentCategory={currentCategory} currentEventType={currentEventType} />
          </div>
        </div>

        {/* Right Side: Quick Links */}
        <div className="hidden lg:flex items-center gap-6 shrink-0">
          {quickLinks.map((link) => {
            const isActive = pathname + (searchParams?.toString() ? '?' + searchParams.toString() : '') === link.href;

            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "text-[12px] font-bold uppercase tracking-wider transition-colors py-1 border-b-2 flex items-center gap-1.5",
                  isActive ? "text-purple-600 border-purple-600" : "text-slate-500 border-transparent hover:text-purple-600",
                  link.name === "Offers" && "text-red-500 hover:text-red-600"
                )}
              >
                {link.name === "Offers" && <Zap className={cn("h-3.5 w-3.5", isActive ? "fill-purple-600" : "fill-red-500")} />}
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
