import {
  LayoutDashboard,
  Store,
  FileCheck,
  CalendarDays,
  Briefcase,
  CreditCard,
  MessageSquare,
  Star,
  Bell,
  Settings,
  Receipt
} from "lucide-react";

export const VENDOR_SIDEBAR_MENU = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/vendor/dashboard" },
  { name: "My Services", icon: Store, href: "/vendor/services" },
  { name: "Bookings", icon: FileCheck, href: "/vendor/bookings" },
  { name: "Availability", icon: CalendarDays, href: "/vendor/availability" },
  { name: "Earnings", icon: Briefcase, href: "/vendor/earnings" },
  { name: "Expenses", icon: Receipt, href: "/vendor/expenses" },
  { name: "Transactions", icon: CreditCard, href: "/vendor/wallet" },
  { name: "Messages", icon: MessageSquare, href: "/vendor/messages" },
  { name: "Reviews", icon: Star, href: "/vendor/reviews" },
  { name: "Notifications", icon: Bell, href: "/vendor/notifications" },
  { name: "Settings", icon: Settings, href: "/vendor/settings" },
];
