"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MoreDropdownProps {
  categories: string[];
  currentCategory: string | null | undefined;
  currentEventType: string | null | undefined;
}

export default function MoreDropdown({ categories, currentCategory, currentEventType }: MoreDropdownProps) {
  const pathname = usePathname();
  const isMoreActive = categories.some(cat => pathname === "/marketplace" && (currentCategory === cat || currentEventType === cat));

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          "flex items-center gap-1 py-3 border-b-2 transition-colors shrink-0 outline-none whitespace-nowrap",
          isMoreActive ? "text-purple-700 border-purple-600 font-semibold" : "border-transparent hover:text-purple-600"
        )}>
          More <ChevronDown className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 max-h-[70vh] overflow-y-auto">
        {categories.map((name) => {
          const isActive = pathname === "/marketplace" && (currentCategory === name || currentEventType === name);
          const href = `/marketplace?eventType=${encodeURIComponent(name)}`;

          return (
            <DropdownMenuItem
              key={name}
              asChild
              className={cn(
                "cursor-pointer font-medium text-[15px] text-slate-800 rounded-lg p-2 hover:bg-purple-50 hover:text-purple-700",
                isActive && "text-purple-700 bg-purple-50"
              )}
            >
              <Link href={href}>
                {name}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
