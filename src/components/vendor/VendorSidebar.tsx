"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LogOut,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useState } from "react";

import { VENDOR_SIDEBAR_MENU } from "@/data/dashboard/vendor-sidebar";

export default function VendorSidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();
  const [isCollapsed, _setIsCollapsed] = useState(false);

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="hidden lg:flex flex-col bg-white h-full border-r border-slate-200 transition-all duration-300"
    >
      <div className="flex-1 py-6 space-y-1 overflow-y-auto px-4 custom-scrollbar">
        {VENDOR_SIDEBAR_MENU.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 text-sm transition-all rounded-xl font-semibold mb-1",
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-slate-400")} />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="truncate"
                >
                  {item.name}
                </motion.span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={logout}
          className={cn(
            "flex items-center gap-3 w-full px-4 py-3.5 text-sm font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all rounded-xl",
            isCollapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </motion.div>
  );
}
