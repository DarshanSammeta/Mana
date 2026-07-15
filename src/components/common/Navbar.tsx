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
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { marketplaceService, authService } from "@/services/client";
import dynamic from "next/dynamic";
import { useWindowSize } from "@/hooks/useWindowSize";

import { SearchInput } from "../marketplace/SearchInput";
import { LocationSelector } from "./LocationSelector";

const NotificationBell = dynamic(() => import("./NotificationBell").then(mod => mod.NotificationBell), {
  ssr: false,
  loading: () => <div className="h-10 w-10 rounded-xl bg-white/10 animate-pulse" />
});

interface EventType {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

export default function Navbar({
  initialEventTypes = [],
  initialCategories = []
}: {
  initialEventTypes?: EventType[],
  initialCategories?: Category[]
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const { width } = useWindowSize();

  const containerRef = useRef<HTMLDivElement>(null);
  const allEventsRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const rightSectionRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafId = useRef<number | null>(null);

  // Selective selectors to prevent re-renders on unrelated store changes
  const cart = useCommerceStore(state => state.cart);
  const cartCount = cart.reduce((acc: number, item: any) => acc + item.quantity, 0);

  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [visibleCount, setVisibleCount] = useState(initialEventTypes.length);

  // Sync selectedCategory with URL
  useEffect(() => {
    const categoryFromUrl = searchParams?.get("category");
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    } else {
      setSelectedCategory("All Categories");
    }
  }, [searchParams]);

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
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const currentEventTypeId = searchParams?.get("eventTypeId") || undefined;

  const { data: categoriesData } = useQuery({
    queryKey: ["categories", currentEventTypeId],
    queryFn: () => marketplaceService.getCategories(currentEventTypeId),
    initialData: currentEventTypeId ? undefined : initialCategories,
    staleTime: 1000 * 60 * 30,
    enabled: true,
    refetchOnMount: false,
  });

  const eventTypes = useMemo(() => eventTypesData || [], [eventTypesData]);
  const categories = useMemo(() => categoriesData || [], [categoriesData]);

  const calculateVisibleItems = useCallback(() => {
    if (!containerRef.current || !allEventsRef.current || width < 768) {
      setVisibleCount(eventTypes.length);
      return;
    }

    const containerWidth = containerRef.current.getBoundingClientRect().width;
    const allEventsWidth = allEventsRef.current.getBoundingClientRect().width;
    const rightSectionWidth = rightSectionRef.current?.getBoundingClientRect().width || 0;

    // Gaps from Tailwind classes (gap-8 = 32px, gap-6 = 24px)
    const sectionGap = 32;
    const navItemGap = 24;
    const moreBtnWidth = moreButtonRef.current?.getBoundingClientRect().width || 80;
    const buffer = 20;

    // Available width for the nav content (two gaps of 32px between AllEvents, Nav, and RightSection)
    const availableWidthFull = containerWidth - allEventsWidth - rightSectionWidth - (sectionGap * 2) - buffer;

    const itemWidths = eventTypes.map((_, i) => {
      return itemRefs.current[i]?.getBoundingClientRect().width || 0;
    });

    // Check if all fit
    let totalWidthOfAll = 0;
    itemWidths.forEach((w, i) => {
      totalWidthOfAll += w + (i > 0 ? navItemGap : 0);
    });

    if (totalWidthOfAll <= availableWidthFull) {
      setVisibleCount(eventTypes.length);

      // Development Verification
      console.table({
        containerWidth,
        availableWidth: availableWidthFull,
        status: "All Fit",
        visibleItems: eventTypes.length,
        overflowItems: 0
      });
      return;
    }

    // Need overflow, account for "More" button
    const availableWithMore = availableWidthFull - moreBtnWidth - navItemGap;
    let currentWidth = 0;
    let count = 0;

    for (let i = 0; i < itemWidths.length; i++) {
      const w = itemWidths[i] + (i > 0 ? navItemGap : 0);
      if (currentWidth + w > availableWithMore) break;
      currentWidth += w;
      count++;
    }

    setVisibleCount(count);

    // Development Verification
    console.table({
      containerWidth,
      availableWidth: availableWithMore,
      status: "Overflow",
      visibleItems: count,
      overflowItems: eventTypes.length - count,
      moreButtonWidth: moreBtnWidth
    });

    console.table(
      eventTypes.map((item, index) => ({
        name: item.name,
        width: itemWidths[index]
      }))
    );
  }, [eventTypes, width]);

  useEffect(() => {
    if (!containerRef.current) return;

    const handleResize = () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(calculateVisibleItems);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    // Initial calculation
    calculateVisibleItems();

    // Font loading handling
    if ("fonts" in document) {
      (document as any).fonts.ready.then(() => {
        handleResize();
      });
    }

    return () => {
      resizeObserver.disconnect();
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [calculateVisibleItems]);

  const navEventTypes = useMemo(() => eventTypes.slice(0, visibleCount), [eventTypes, visibleCount]);
  const moreEventTypes = useMemo(() => eventTypes.slice(visibleCount), [eventTypes, visibleCount]);
  const showMore = moreEventTypes.length > 0;

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
        <div className="bg-[#6C3CF0] text-white py-3 px-4 md:px-8">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-6 md:gap-10">
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
                  <span className="text-2xl font-bold tracking-tight text-white">
                    mana<span className="text-yellow-400">Events</span>
                  </span>
                </div>
              </Link>
            </div>

            <LocationSelector />

            <div className="hidden md:flex flex-1 max-w-2xl items-center relative group shadow-sm bg-white border border-gray-200 rounded-[2rem] focus-within:border-white focus-within:ring-2 focus-within:ring-yellow-400 transition-all">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-6 pr-4 py-3 text-[14px] font-medium text-slate-700 hover:text-purple-700 hover:bg-gray-50 border-r border-gray-100 outline-none rounded-l-[2rem] transition-colors whitespace-nowrap">
                    <span className="truncate max-w-[120px]">{selectedCategory}</span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50">
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedCategory("All Categories");
                      if (pathname === "/marketplace") {
                        const params = new URLSearchParams(searchParams?.toString() || "");
                        params.delete("category");
                        params.delete("page");
                        router.replace(`/marketplace?${params.toString()}`, { scroll: false });
                      }
                    }}
                    className="cursor-pointer font-medium text-[15px] text-slate-800 rounded-lg hover:bg-purple-50 hover:text-purple-700 p-2"
                  >
                    All Categories
                  </DropdownMenuItem>
                  {categories?.map((cat: any) => (
                    <DropdownMenuItem
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        if (pathname === "/marketplace") {
                          const params = new URLSearchParams(searchParams?.toString() || "");
                          params.set("category", cat.name);
                          params.delete("page");
                          router.replace(`/marketplace?${params.toString()}`, { scroll: false });
                        }
                      }}
                      className="cursor-pointer font-medium text-[15px] text-slate-800 rounded-lg hover:bg-purple-50 hover:text-purple-700 p-2"
                    >
                      {cat.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex-1 flex items-center relative h-full px-0">
                <SearchInput initialValue={searchParams?.get("query") || ""} category={selectedCategory} />
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
              {!user || user.role !== "VENDOR" ? (
                <Link href="/vendor" className="hidden lg:block text-[14px] font-medium hover:text-yellow-400 transition-colors">Become a Vendor</Link>
              ) : (
                <div className="hidden lg:flex items-center gap-4">
                   <Link href="/vendor/dashboard" className="text-[14px] font-medium hover:text-yellow-400 transition-colors">Vendor Dashboard</Link>
                   <Link href="/vendor/bookings" className="text-[14px] font-medium hover:text-yellow-400 transition-colors">Orders</Link>
                </div>
              )}
              {user && <div className="hidden sm:block"><NotificationBell /></div>}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 p-2 lg:px-4 rounded-xl transition-all border border-transparent">
                    <div className="hidden md:block text-left">
                      <p className="text-[11px] font-medium text-white/90">Hello, {user ? user.fullName.split(' ')[0] : 'Sign in'}</p>
                      <p className="text-[14px] font-semibold flex items-center gap-1.5">Account <ChevronDown className="h-3 w-3 opacity-50" /></p>
                    </div>
                    <UserCircle className="h-6 w-6 text-white" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-4 rounded-2xl mt-3 shadow-2xl border-gray-100">
                  {!user ? (
                    <div className="flex flex-col items-center gap-3 mb-2">
                      <Link href="/login" className="w-full">
                        <button className="w-full bg-[#6C3CF0] hover:bg-[#5830C7] text-white font-semibold py-3 rounded-xl shadow-md text-sm">Sign in</button>
                      </Link>
                      <p className="text-[12px] text-gray-500 font-medium">New to Mana Events? <Link href="/register" className="text-[#6C3CF0] font-semibold hover:underline">Start here.</Link></p>
                    </div>
                  ) : (
                    <>
                      <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-gray-400">Manage Account</DropdownMenuLabel>
                      {user.role === "VENDOR" ? (
                        <>
                          <DropdownMenuItem asChild className="rounded-lg p-2.5 cursor-pointer font-medium text-[15px] text-slate-800 hover:bg-purple-50 hover:text-purple-700">
                            <Link href="/vendor/dashboard" className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> Vendor Dashboard</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="rounded-lg p-2.5 cursor-pointer font-medium text-[15px] text-slate-800 hover:bg-purple-50 hover:text-purple-700">
                            <Link href="/vendor/bookings" className="flex items-center gap-2"><Package className="h-4 w-4" /> Vendor Orders</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="rounded-lg p-2.5 cursor-pointer font-medium text-[15px] text-slate-800 hover:bg-purple-50 hover:text-purple-700">
                            <Link href="/vendor/revenue" className="flex items-center gap-2"><Zap className="h-4 w-4" /> Vendor Earnings</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="rounded-lg p-2.5 cursor-pointer font-medium text-[15px] text-slate-800 hover:bg-purple-50 hover:text-purple-700">
                            <Link href="/vendor/settings" className="flex items-center gap-2"><UserCircle className="h-4 w-4" /> Vendor Profile</Link>
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem asChild className="rounded-lg p-2.5 cursor-pointer font-medium text-[15px] text-slate-800 hover:bg-purple-50 hover:text-purple-700">
                            <Link href="/customer/dashboard" className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="rounded-lg p-2.5 cursor-pointer font-medium text-[15px] text-slate-800 hover:bg-purple-50 hover:text-purple-700">
                            <Link href="/customer/bookings" className="flex items-center gap-2"><Package className="h-4 w-4" /> Your Bookings</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="rounded-lg p-2.5 cursor-pointer font-medium text-[15px] text-slate-800 hover:bg-purple-50 hover:text-purple-700">
                            <Link href="/customer/wishlist" className="flex items-center gap-2"><Heart className="h-4 w-4" /> Wishlist</Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator className="my-2" />
                      <DropdownMenuItem onClick={handleLogout} className="rounded-lg p-2.5 cursor-pointer font-medium text-[15px] text-red-600 hover:bg-red-50 flex items-center gap-2">
                        <LogOut className="h-4 w-4" /> Sign Out
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {user && (
                <Link href="/customer/cart" className="flex items-center gap-2 hover:bg-white/10 p-2 rounded-xl transition-all relative">
                  <div className="relative">
                    <ShoppingCart className="h-6 w-6 md:h-7 md:w-7" />
                    <span className="absolute -top-2 -right-2 bg-yellow-400 text-[#1B2533] font-bold text-[11px] h-5 w-5 rounded-full flex items-center justify-center shadow-md">
                      {isMounted ? cartCount : 0}
                    </span>
                  </div>
                  <span className="font-semibold text-sm hidden lg:inline">Cart</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Sub-Navbar with Category Navigation */}
        <div className="bg-white h-12 flex items-center px-4 md:px-8 overflow-hidden shadow-sm relative">
          {/* Ghost Measuring Container - Hidden from view but used for real DOM calculations */}
          <div className="absolute opacity-0 pointer-events-none flex items-center gap-6 whitespace-nowrap -z-50 overflow-hidden" aria-hidden="true">
            {eventTypes.map((type, i) => (
              <div
                key={`measure-${type.id}`}
                ref={el => { itemRefs.current[i] = el; }}
                className="font-medium text-[14px]"
              >
                {type.name}
              </div>
            ))}
          </div>

          <div ref={containerRef} className="max-w-[1600px] mx-auto w-full flex items-center gap-8 text-[14px] font-medium text-slate-700">
            <button
              ref={allEventsRef}
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center gap-2 hover:text-purple-700 py-3 border-b-2 border-transparent hover:border-purple-600 shrink-0"
            >
              <Menu className="h-5 w-5" />
              <span>All Events</span>
            </button>

            <nav ref={navRef as any} className="flex items-center gap-6 overflow-hidden">
              {navEventTypes.map((type) => {
                const isActive = pathname === "/marketplace" && searchParams?.get('eventTypeId') === type.id;
                return (
                  <Link
                    key={type.id}
                    href={`/marketplace?eventTypeId=${type.id}&eventName=${encodeURIComponent(type.name)}`}
                    className={cn(
                      "whitespace-nowrap py-3 border-b-2 transition-colors",
                      isActive ? "text-purple-700 border-purple-600 font-semibold" : "border-transparent hover:text-purple-600"
                    )}
                  >
                    {type.name}
                  </Link>
                );
              })}

              {showMore && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      ref={moreButtonRef}
                      className="flex items-center gap-1 hover:text-purple-600 py-3 border-b-2 border-transparent shrink-0 outline-none transition-all"
                    >
                      More <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-64 p-2 z-[60] bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200"
                  >
                    <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      More Categories
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-100" />
                    <div className="max-h-[60vh] overflow-y-auto py-1 custom-scrollbar">
                      {moreEventTypes.map((t) => (
                        <DropdownMenuItem
                          key={t.id}
                          asChild
                          className="rounded-xl focus:bg-purple-50 focus:text-purple-700 transition-all cursor-pointer group"
                        >
                          <Link
                            href={`/marketplace?eventTypeId=${t.id}&eventName=${encodeURIComponent(t.name)}`}
                            className="flex items-center justify-between p-3 w-full"
                          >
                            <span className="font-semibold text-slate-700 group-focus:text-purple-700">{t.name}</span>
                            <ChevronRight className="h-4 w-4 text-slate-400 group-focus:text-purple-500 transition-transform group-hover:translate-x-0.5" />
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </nav>

            <div ref={rightSectionRef} className="ml-auto hidden xl:flex items-center gap-8">
               <Link href="/customer/offers" className="text-red-500 font-semibold flex items-center gap-2 transition-colors hover:text-red-600">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white z-[70] shadow-2xl flex flex-col">
              <div className="bg-[#1E293B] text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCircle className="h-10 w-10 text-slate-400" />
                  <div>
                    <p className="text-sm font-semibold">Hello, {user ? user.fullName : "Sign In"}</p>
                    <p className="text-[11px] text-gray-400">Account Details</p>
                  </div>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)}><X className="h-6 w-6" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div>
                  <h3 className="text-lg font-bold mb-2">Event Types</h3>
                  {eventTypes.map((type) => (
                    <Link key={type.id} href={`/marketplace?eventTypeId=${type.id}`} onClick={() => setIsMobileMenuOpen(false)} className="block py-3 border-b text-slate-700">{type.name}</Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
