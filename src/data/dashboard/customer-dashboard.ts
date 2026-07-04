import {
  Package,
  MessageSquare,
  Wallet,
  Heart,
  ShieldCheck,
  MapPin
} from "lucide-react";

export const CUSTOMER_QUICK_LINKS = [
  { title: "My Bookings", icon: Package, desc: "Track and manage your upcoming events", href: "/customer/orders", color: "text-blue-600", bg: "bg-blue-50" },
  { title: "Messages", icon: MessageSquare, desc: "Chat with your event vendors", href: "/customer/messages", color: "text-purple-600", bg: "bg-purple-50" },
  { title: "Mana Wallet", icon: Wallet, desc: "Manage funds and quick payments", href: "/customer/wallet", color: "text-emerald-600", bg: "bg-emerald-50" },
  { title: "Saved Vendors", icon: Heart, desc: "View your favorited services", href: "/customer/wishlist", color: "text-rose-600", bg: "bg-rose-50" },
  { title: "Profile & Security", icon: ShieldCheck, desc: "Manage account and privacy settings", href: "/customer/settings", color: "text-slate-600", bg: "bg-slate-50" },
  { title: "Addresses", icon: MapPin, desc: "Manage event location addresses", href: "/customer/addresses", color: "text-amber-600", bg: "bg-amber-50" },
];

export const SMART_MATCH_FALLBACKS = [
  { name: "Luxury Floral Decor", category: "DECOR", rating: "4.9", price: "₹45,000", reviews: "128" },
  { name: "Spicy Fusion Catering", category: "FOOD", rating: "4.7", price: "₹800/pp", reviews: "2.4k" },
  { name: "Studio 45 Photography", category: "VISUALS", rating: "4.8", price: "₹25,000", reviews: "86" }
];
