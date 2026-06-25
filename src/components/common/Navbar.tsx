"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCommerceStore } from "@/store/commerceStore";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useLoadingStore } from "@/store/loadingStore";
import {
  UserCircle,
  ShoppingCart,
  Heart,
  Sparkles,
  Search,
  MapPin,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Bell,
  Package,
  X,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useLocationStore } from "@/store/locationStore";
import { NotificationBell } from "./NotificationBell";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { city, setCity, setLocation } = useLocationStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("All");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("query", searchQuery);
    if (searchCategory !== "All") params.set("category", searchCategory);
    router.push(`/marketplace?${params.toString()}`);
    setIsMobileMenuOpen(false);
  };

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const res = await axios.get("/api/categories");
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        return [];
      }
    },
  });

  const categories = categoriesData || [];
  const { cart = [] } = useCommerceStore();
  const cartCount = cart.reduce((acc: number, item: any) => acc + item.quantity, 0);

  const mainCategories = [
    "Weddings", "Photography", "Decoration", "Catering", "Makeup", "Music & DJ", "Venues", "Travel"
  ];

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      logout();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback: clear local state and redirect anyway
      logout();
      router.push("/login");
    }
  };

  return (
    <>
      <header className="flex flex-col w-full z-50 sticky top-0 shadow-md">
      {/* Top Bar - Midnight Dark */}
      <div className="bg-[#111827] text-white py-2 px-4 md:px-6">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between md:gap-8">
          {/* Left Side: Menu (Mobile) & Logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-1 hover:bg-white/10 rounded-md"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/" className="shrink-0 flex items-center pt-1 group">
              <span className="text-xl md:text-2xl font-bold tracking-tight text-white group-hover:opacity-90 transition-opacity">
                mana<span className="text-[#F59E0B]">Events</span>
              </span>
            </Link>
          </div>

          {/* Location Picker - Hidden on small mobile */}
          <button className="hidden sm:flex items-center gap-1 hover:outline hover:outline-1 outline-white p-1 rounded-sm transition-all group max-w-[150px]">
            <MapPin className="h-5 w-5 text-gray-400 group-hover:text-white shrink-0" />
            <div className="text-left leading-tight truncate">
              <p className="text-[10px] md:text-[12px] text-gray-400">Deliver to</p>
              <p className="text-[12px] md:text-[14px] font-bold truncate">{city || "India"}</p>
            </div>
          </button>

          {/* Desktop Search Bar */}
          <div className="hidden lg:flex flex-1 items-center h-10 rounded-full bg-white shadow-sm focus-within:ring-2 ring-[#F59E0B] transition-all overflow-hidden mx-4">
            <select
              className="bg-gray-100 text-gray-700 text-sm h-full pl-5 pr-2 border-r border-gray-200 outline-none cursor-pointer hover:bg-gray-200 transition-colors rounded-l-full"
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
            >
              <option>All</option>
              {categories.map((c: any) => (
                <option key={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search for services, photographers, venues..."
              className="flex-1 h-full px-4 text-black outline-none text-base bg-transparent placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="bg-[#F59E0B] hover:bg-[#D97706] h-full px-6 flex items-center justify-center transition-colors rounded-r-full group"
            >
              <Search className="h-5 w-5 text-black group-hover:scale-110 transition-transform" />
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden sm:block">
              <NotificationBell />
            </div>

            {/* Account Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center md:flex-col text-left hover:outline hover:outline-1 outline-white p-1 rounded-sm transition-all">
                  <div className="hidden md:block">
                    <p className="text-[12px] text-gray-400">Hello, {user ? user.fullName.split(' ')[0] : 'sign in'}</p>
                    <p className="text-[14px] font-bold flex items-center gap-1">
                      Account <ChevronDown className="h-3 w-3" />
                    </p>
                  </div>
                  <UserCircle className="h-7 w-7 md:hidden" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-4 rounded-lg mt-2">
                {!user ? (
                   <div className="flex flex-col items-center gap-2 mb-4">
                      <Link href="/login" className="w-full">
                        <button className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold py-2 rounded-md shadow-sm text-sm">Sign in</button>
                      </Link>
                      <p className="text-[11px]">New customer? <Link href="/register" className="text-blue-600 hover:underline">Start here.</Link></p>
                   </div>
                ) : (
                  <>
                    <DropdownMenuLabel>Your Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link href="/customer/dashboard">Your Profile</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/customer/bookings">Your Bookings</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/customer/wishlist">Shortlisted</Link></DropdownMenuItem>
                    {user.role === "VENDOR" && (
                       <>
                         <DropdownMenuSeparator />
                         <DropdownMenuLabel>Merchant Tools</DropdownMenuLabel>
                         <DropdownMenuItem asChild><Link href="/vendor/dashboard">Vendor Panel</Link></DropdownMenuItem>
                       </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600 font-bold"
                    >
                      Sign Out
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Returns & Orders - Hidden on mobile */}
            <Link href="/customer/bookings" className="hidden lg:flex flex-col text-left hover:outline hover:outline-1 outline-white p-1 rounded-sm transition-all">
              <p className="text-[12px] text-gray-400">Returns</p>
              <p className="text-[14px] font-bold">& Bookings</p>
            </Link>

            {/* Cart */}
            <Link href="/customer/cart" className="flex items-end gap-1 hover:outline hover:outline-1 outline-white p-1 rounded-sm transition-all relative">
              <div className="relative">
                <ShoppingCart className="h-7 w-7 md:h-8 md:w-8" />
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[#F59E0B] font-bold text-[12px] md:text-base bg-[#111827] px-1 rounded-full">
                  {cartCount}
                </span>
              </div>
              <span className="font-bold text-sm mb-0.5 hidden sm:inline">Cart</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar - Visible only on mobile/tablet */}
      <div className="lg:hidden bg-[#111827] px-4 pb-3">
        <div className="flex items-center h-10 rounded-full bg-white shadow-sm focus-within:ring-2 ring-[#F59E0B] transition-all overflow-hidden">
          <input
            type="text"
            placeholder="Search Mana Events"
            className="flex-1 h-full px-5 text-black outline-none text-sm bg-transparent placeholder:text-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="bg-[#F59E0B] hover:bg-[#D97706] h-full px-5 flex items-center justify-center transition-colors rounded-r-full"
          >
            <Search className="h-4 w-4 text-black" />
          </button>
        </div>
      </div>

      {/* Sub-Header Navigation - Brand Purple */}
      <div className="bg-[#6D28D9] text-white h-10 flex items-center px-4 overflow-x-auto no-scrollbar shadow-md">
        <div className="max-w-[1500px] mx-auto w-full flex items-center gap-6 text-[14px] font-bold">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex items-center gap-1 hover:outline hover:outline-1 outline-white p-1.5 whitespace-nowrap"
          >
            <Menu className="h-5 w-5" /> All
          </button>

          <nav className="flex items-center gap-4">
            {mainCategories.map((cat) => (
              <Link
                key={cat}
                href={`/marketplace?category=${cat}`}
                className="hover:outline hover:outline-1 outline-white p-1.5 whitespace-nowrap"
              >
                {cat}
              </Link>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 hover:outline hover:outline-1 outline-white p-1.5 whitespace-nowrap">
                  More <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                {categories.filter(c => !mainCategories.includes(c.name)).map(c => (
                  <DropdownMenuItem key={c.id} asChild>
                    <Link href={`/marketplace?category=${c.name}`}>{c.name}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="ml-auto">
             <Link href="/vendor/register" className="hover:outline hover:outline-1 outline-white p-1.5 whitespace-nowrap">
               Register as Vendor
             </Link>
          </div>
        </div>
      </div>
    </header>
    <AnimatePresence>
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white z-[70] shadow-2xl flex flex-col"
          >
            {/* Drawer Header */}
            <div className="bg-[#111827] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
                  <UserCircle className="h-7 w-7" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-bold">Hello, {user ? user.fullName : "Sign In"}</p>
                  <p className="text-[10px] text-gray-400">Account & Personal Details</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 hover:bg-white/10 rounded-md"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto py-2">
              <div className="px-4 py-3">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">Shop By Category</h3>
                <div className="space-y-1">
                  {mainCategories.map((cat) => (
                    <Link
                      key={cat}
                      href={`/marketplace?category=${cat}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-gray-50 text-gray-700 font-bold transition-colors group"
                    >
                      {cat}
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="h-2 bg-gray-100" />

              <div className="px-4 py-3">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">Account & Settings</h3>
                <div className="space-y-1">
                  <Link
                    href="/customer/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-gray-50 text-gray-700 font-bold transition-colors"
                  >
                    <LayoutDashboard className="h-5 w-5 text-gray-400" /> Your Dashboard
                  </Link>
                  <Link
                    href="/customer/bookings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-gray-50 text-gray-700 font-bold transition-colors"
                  >
                    <Package className="h-5 w-5 text-gray-400" /> Your Bookings
                  </Link>
                  <Link
                    href="/customer/wishlist"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-gray-50 text-gray-700 font-bold transition-colors"
                  >
                    <Heart className="h-5 w-5 text-gray-400" /> Shortlisted
                  </Link>
                  {user?.role === "VENDOR" && (
                    <Link
                      href="/vendor/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-3 px-2 rounded-lg bg-primary/5 text-primary font-black transition-colors"
                    >
                      <Sparkles className="h-5 w-5" /> Vendor Panel
                    </Link>
                  )}
                </div>
              </div>

              <div className="h-2 bg-gray-100" />

              <div className="px-4 py-4">
                {user ? (
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-100 text-red-600 font-black hover:bg-red-50 transition-all uppercase tracking-widest text-xs"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center py-3 rounded-xl bg-primary text-white font-black hover:bg-primary/90 transition-all uppercase tracking-widest text-xs"
                  >
                    Sign In / Register
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  </>
);
}
