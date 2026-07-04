"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCommerceStore } from "@/store/commerceStore";
import { useQuery } from "@tanstack/react-query";
import {
  UserCircle,
  ShoppingCart,
  Heart,
  Sparkles,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  X,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLocationStore } from "@/store/locationStore";
import { useLocation } from "@/hooks/useLocation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { marketplaceService, authService } from "@/services";
import dynamic from "next/dynamic";

import { SearchInput } from "../marketplace/SearchInput";
import { LocationSelector } from "./LocationSelector";

const NotificationBell = dynamic(() => import("./NotificationBell").then(mod => mod.NotificationBell), {
  ssr: false,
  loading: () => <div className="h-10 w-10 rounded-xl bg-white/10 animate-pulse" />
});

export default function Navbar({
  initialEventTypes = [],
  initialCategories = []
}: {
  initialEventTypes?: any[],
  initialCategories?: any[]
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const { city: _city, setCity: _setCity } = useLocationStore();
  const { detectLocation: _autoDetectLocation } = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("navbar-search")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const { data: eventTypesData } = useQuery({
    queryKey: ["event-types"],
    queryFn: () => marketplaceService.getEventTypes(),
    initialData: initialEventTypes,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const currentEventTypeId = searchParams?.get("eventTypeId") || undefined;

  const { data: categoriesData } = useQuery({
    queryKey: ["categories", currentEventTypeId],
    queryFn: () => marketplaceService.getCategories(currentEventTypeId),
    initialData: currentEventTypeId ? undefined : initialCategories,
    staleTime: 1000 * 60 * 30, // 30 mins
    enabled: true, // Always load categories for the search dropdown
    refetchOnMount: false,
  });

  const eventTypes = eventTypesData || [];
  const categories = categoriesData || [];

  // Sub-header navigation split logic: 7 items total, then "More"
  const MAX_NAV_VISIBLE = 7;
  const navEventTypes = eventTypes.slice(0, MAX_NAV_VISIBLE);
  const navCategories = categories.slice(0, Math.max(0, MAX_NAV_VISIBLE - navEventTypes.length));
  const moreEventTypes = eventTypes.slice(navEventTypes.length);
  const moreCategories = categories.slice(navCategories.length);
  const showMore = moreEventTypes.length > 0 || moreCategories.length > 0;

  const { cart = [] } = useCommerceStore();
  const cartCount = cart.reduce((acc: number, item: any) => acc + item.quantity, 0);

  const handleLogout = async () => {
    try {
      await authService.logout();
      logout();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      logout();
      router.push("/login");
    }
  };

  return (
    <>
      <header className="flex flex-col w-full z-50 sticky top-0 shadow-lg border-b border-gray-100">
      {/* Top Bar - Premium Mana Purple */}
      <div className="bg-[#6C3CF0] text-white py-3 px-4 md:px-8">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-6 md:gap-10">
          {/* Left Side: Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/" className="shrink-0 flex items-center group">
              <div className="flex items-center gap-2">
                <div className="bg-white/10 p-1.5 rounded-xl group-hover:bg-white/20 transition-all">
                  <Sparkles className="h-6 w-6 text-yellow-400 fill-yellow-400" />
                </div>
                <span className="text-2xl font-black tracking-tight text-white">
                  mana<span className="text-yellow-400">Events</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Location Picker */}
          <LocationSelector />

          {/* PREMIUM SEARCH BAR (Amazon-Inspired) */}
          <div className="hidden md:flex flex-1 max-w-2xl items-center relative group shadow-sm bg-white border border-gray-200 rounded-[2rem] focus-within:border-white focus-within:ring-2 focus-within:ring-yellow-400 transition-all">
            {/* 1. Category Dropdown (Left Side) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label="Select Category" className="flex items-center gap-2 pl-6 pr-4 py-3 text-[13px] font-black uppercase tracking-wider text-gray-500 hover:text-purple-700 hover:bg-gray-50 border-r border-gray-100 outline-none rounded-l-[2rem] transition-colors whitespace-nowrap">
                  <span className="truncate max-w-[120px]">{selectedCategory}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50">
                <DropdownMenuItem
                  onClick={() => setSelectedCategory("All Categories")}
                  className="cursor-pointer font-bold rounded-lg hover:bg-purple-50 hover:text-purple-700 p-2 transition-colors"
                >
                  All Categories
                </DropdownMenuItem>
                {categories?.map((cat: any) => (
                  <DropdownMenuItem
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className="cursor-pointer font-bold rounded-lg hover:bg-purple-50 hover:text-purple-700 p-2 transition-colors"
                  >
                    {cat.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 2. Search Input Area (Middle) */}
            <div className="flex-1 flex items-center relative h-full px-0">
              <SearchInput
                initialValue={searchParams?.get("query") || ""}
                category={selectedCategory}
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 md:gap-6">
            <Link href="/vendor/register" className="hidden lg:block">
              <button className="text-[13px] font-black uppercase tracking-wider hover:text-yellow-400 transition-colors whitespace-nowrap">
                Become a Vendor
              </button>
            </Link>

            {user && (
              <div className="hidden sm:block">
                <NotificationBell />
              </div>
            )}

            {/* Account Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label="User Account" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 p-2 lg:px-4 rounded-xl transition-all border border-transparent">
                  <div className="hidden md:block text-left">
                    <p className="text-[10px] uppercase font-black tracking-widest text-white/90">Hello, {user ? user.fullName.split(' ')[0] : 'Sign in'}</p>
                    <p className="text-[14px] font-bold flex items-center gap-1.5">
                      Account <ChevronDown className="h-3 w-3 opacity-50" />
                    </p>
                  </div>
                  <UserCircle className="h-6 w-6 text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-4 rounded-2xl mt-3 shadow-2xl border-gray-100">
                {!user ? (
                   <div className="flex flex-col items-center gap-3 mb-2">
                      <Link href="/login" className="w-full">
                        <button className="w-full bg-[#6C3CF0] hover:bg-[#5830C7] text-white font-bold py-3 rounded-xl shadow-md text-sm transition-all">Sign in</button>
                      </Link>
                      <p className="text-[11px] text-gray-500 font-medium">New to Mana Events? <Link href="/register" className="text-[#6C3CF0] font-bold hover:underline">Start here.</Link></p>
                   </div>
                ) : (
                  <>
                    <DropdownMenuLabel className="px-2 py-1.5 text-xs font-black uppercase tracking-widest text-gray-400">Manage Account</DropdownMenuLabel>
                    <DropdownMenuItem asChild className="rounded-lg p-2.5 cursor-pointer font-bold hover:bg-purple-50 hover:text-purple-700 transition-colors"><Link href="/customer/dashboard" className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg p-2.5 cursor-pointer font-bold hover:bg-purple-50 hover:text-purple-700 transition-colors"><Link href="/customer/bookings" className="flex items-center gap-2"><Package className="h-4 w-4" /> Your Bookings</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg p-2.5 cursor-pointer font-bold hover:bg-purple-50 hover:text-purple-700 transition-colors"><Link href="/customer/wishlist" className="flex items-center gap-2"><Heart className="h-4 w-4" /> Wishlist</Link></DropdownMenuItem>
                    {user.role === "VENDOR" && (
                       <>
                         <DropdownMenuSeparator className="my-2" />
                         <DropdownMenuLabel className="px-2 py-1.5 text-xs font-black uppercase tracking-widest text-orange-500">Merchant Center</DropdownMenuLabel>
                         <DropdownMenuItem asChild className="rounded-lg p-2.5 cursor-pointer font-bold bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors"><Link href="/vendor/dashboard" className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> Vendor Panel</Link></DropdownMenuItem>
                       </>
                    )}
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem
                      onClick={() => handleLogout()}
                      className="rounded-lg p-2.5 cursor-pointer font-black text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cart */}
            {user && (
              <Link href="/customer/cart" className="flex items-center gap-2 hover:bg-white/10 p-2 rounded-xl transition-all relative">
                <div className="relative">
                  <ShoppingCart className="h-6 w-6 md:h-7 md:w-7" />
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-[#1B2533] font-black text-[11px] h-5 w-5 rounded-full flex items-center justify-center shadow-md">
                    {isMounted ? cartCount : 0}
                  </span>
                </div>
                <span className="font-black text-sm hidden lg:inline">Cart</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Header Navigation - Enterprise Grade Secondary Bar */}
      <div className="bg-white h-12 flex items-center px-4 md:px-8 overflow-x-auto no-scrollbar shadow-sm">
        <div className="max-w-[1600px] mx-auto w-full flex items-center gap-8 text-[12px] font-black uppercase tracking-widest text-gray-600">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open all events menu"
            className="flex items-center gap-2 hover:text-purple-700 transition-colors whitespace-nowrap py-3 border-b-2 border-transparent hover:border-purple-600"
          >
            <Menu className="h-5 w-5" />
            <span>All Events</span>
          </button>

          <nav className="flex items-center gap-6">
            {/* Dynamic Event Types */}
            {navEventTypes.map((type: any) => {
                const isActive = pathname === "/marketplace" && searchParams?.get('eventTypeId') === type.id;
              return (
                <Link
                  key={type.id}
                  href={`/marketplace?eventTypeId=${type.id}&eventName=${type.name}`}
                  prefetch={true}
                  className={cn(
                    "whitespace-nowrap transition-all py-3 border-b-2",
                    isActive ? "text-purple-700 border-purple-600" : "text-gray-600 border-transparent hover:text-purple-600"
                  )}
                >
                  {type.name}
                </Link>
              );
            })}

            {/* Dynamic Categories */}
            {navCategories.map((cat: any) => {
                const isActive = pathname === "/marketplace" && searchParams?.get('category') === cat.name;
              return (
                <Link
                  key={cat.id}
                  href={`/marketplace?category=${cat.name}`}
                  prefetch={true}
                  className={cn(
                    "whitespace-nowrap transition-all py-3 border-b-2",
                    isActive ? "text-purple-700 border-purple-600" : "text-gray-600 border-transparent hover:text-purple-600"
                  )}
                >
                  {cat.name}
                </Link>
              );
            })}

            {/* More Dropdown */}
            {showMore && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 text-gray-500 hover:text-purple-600 transition-colors py-3 border-b-2 border-transparent">
                    More <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50">
                   {moreEventTypes.length > 0 && (
                     <>
                       <DropdownMenuLabel className="px-2 py-1.5 text-xs font-black uppercase tracking-widest text-gray-400">Other Events</DropdownMenuLabel>
                       {moreEventTypes.map((type: any) => (
                         <DropdownMenuItem key={type.id} asChild>
                           <Link href={`/marketplace?eventTypeId=${type.id}&eventName=${type.name}`} className="cursor-pointer font-medium rounded-lg hover:bg-purple-50 hover:text-purple-700 p-2 transition-colors block w-full">
                             {type.name}
                           </Link>
                         </DropdownMenuItem>
                       ))}
                     </>
                   )}
                   {moreCategories.length > 0 && (
                     <>
                       {moreEventTypes.length > 0 && <DropdownMenuSeparator className="my-1" />}
                       <DropdownMenuLabel className="px-2 py-1.5 text-xs font-black uppercase tracking-widest text-gray-400">Other Categories</DropdownMenuLabel>
                       {moreCategories.map((cat: any) => (
                         <DropdownMenuItem key={cat.id} asChild>
                           <Link href={`/marketplace?category=${cat.name}`} className="cursor-pointer font-medium rounded-lg hover:bg-purple-50 hover:text-purple-700 p-2 transition-colors block w-full">
                             {cat.name}
                           </Link>
                         </DropdownMenuItem>
                       ))}
                     </>
                   )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          <div className="ml-auto hidden xl:flex items-center gap-8">
             <Link href="/customer/offers" className="text-red-500 hover:text-red-600 transition-colors font-black flex items-center gap-2">
                <Zap className="h-4 w-4 fill-red-500" /> Hot Offers
             </Link>
             <Link href="/about" className="hover:text-purple-600 transition-colors">About Us</Link>
             <Link href="/contact" className="hover:text-purple-600 transition-colors">Contact</Link>
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
            <div className="bg-[#1E293B] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
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
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">Shop By Event Type</h3>
                <div className="space-y-1">
                  {eventTypes.map((type: any) => (
                    <Link
                      key={type.id}
                      href={`/marketplace?eventTypeId=${type.id}&eventName=${type.name}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-gray-50 text-gray-700 font-bold transition-colors group"
                    >
                      {type.name}
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="h-2 bg-gray-100" />

              <div className="px-4 py-3">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">Shop By Category</h3>
                <div className="space-y-1">
                  {categories.map((cat: any) => (
                    <Link
                      key={cat.id}
                      href={`/marketplace?category=${cat.name}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-gray-50 text-gray-700 font-bold transition-colors group"
                    >
                      {cat.name}
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
                      className="flex items-center gap-3 py-3 px-2 rounded-lg bg-blue-50 text-blue-600 font-black transition-colors"
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
                    className="w-full flex items-center justify-center py-3 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-all uppercase tracking-widest text-xs"
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
