"use client";

import NavLink from "../common/NavLink";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Heart,
  MessageSquare,
  Wallet,
  Star,
  Settings,
  Bell,
  MapPin,
  LogOut,
  UserCircle,
  FileText,
  CreditCard
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const sections = [
  {
    title: "Orders & Bookings",
    items: [
      { name: "My Bookings", icon: Calendar, href: "/customer/orders" },
      { name: "Wishlist", icon: Heart, href: "/customer/wishlist" },
      { name: "Reviews", icon: Star, href: "/customer/reviews" },
    ]
  },
  {
    title: "Communication",
    items: [
      { name: "Messages", icon: MessageSquare, href: "/customer/messages" },
      { name: "Notifications", icon: Bell, href: "/customer/notifications" },
    ]
  },
  {
    title: "Payments & Wallet",
    items: [
      { name: "My Wallet", icon: Wallet, href: "/customer/wallet" },
      { name: "Invoices", icon: FileText, href: "/customer/invoices" },
      { name: "Saved Cards", icon: CreditCard, href: "/customer/payments" },
    ]
  },
  {
    title: "Account Settings",
    items: [
      { name: "Profile", icon: UserCircle, href: "/customer/settings" },
      { name: "Addresses", icon: MapPin, href: "/customer/addresses" },
      { name: "Security", icon: Settings, href: "/customer/settings" },
    ]
  }
];

export default function CustomerSidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  return (
    <div className="flex flex-col w-full bg-white overflow-hidden">
      <nav className="flex-1 p-3">
        {sections.map((section) => (
          <div key={section.title} className="mb-4 last:mb-0">
            <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <NavLink
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-sm transition-all rounded-xl font-medium",
                      isActive
                        ? "bg-blue-50 text-primary shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-slate-400")} />
                    {item.name}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}

        <div className="mt-4 pt-4 border-t border-slate-100">
           <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </nav>
    </div>
  );
}
