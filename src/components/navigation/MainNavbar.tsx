"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Menu, UserCircle, ChevronDown, ShoppingCart } from "lucide-react";
import { LocationSelector } from "../common/LocationSelector";
import { SearchInput } from "../marketplace/SearchInput";
import dynamic from "next/dynamic";
import Image from "next/image";
import ManaEventsLogo from "@/assets/logos/ManaEvents.png";

const NotificationBell = dynamic(() => import("../common/NotificationBell").then(mod => mod.NotificationBell), {
  ssr: false,
  loading: () => <div className="h-10 w-10 rounded-xl bg-white/10 animate-pulse" />
});

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { visibleCategories, moreCategories } from "@/config/navigation/categories";

interface MainNavbarProps {
  user: any;
  logout: () => void;
  cartCount: number;
  isMounted: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export default function MainNavbar({
  user,
  logout,
  cartCount,
  isMounted,
  setIsMobileMenuOpen
}: MainNavbarProps) {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  return (
    <div className="bg-[#6C3CF0] text-white py-3 px-4 md:px-8">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4 md:gap-10">

        {/* 1. Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/" className="shrink-0 flex items-center group">
            <div className="flex items-center">
              <Image
                src={ManaEventsLogo}
                alt="Mana Events"
                width={150}
                height={40}
                priority
                className="h-9 w-auto md:h-10"
              />
            </div>
          </Link>
        </div>

        {/* 2. Location Selector */}
        <div className="hidden md:block shrink-0">
            <LocationSelector />
        </div>

        {/* 3. Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xl items-center relative group shadow-sm bg-white border border-gray-200 rounded-[2rem] focus-within:border-white focus-within:ring-2 focus-within:ring-yellow-400 transition-all">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-6 pr-4 py-3 text-[14px] font-medium text-slate-700 hover:text-purple-700 hover:bg-gray-50 border-r border-gray-100 outline-none rounded-l-[2rem] transition-colors whitespace-nowrap">
                <span className="truncate max-w-[120px]">{selectedCategory}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50">
              <DropdownMenuItem
                onClick={() => setSelectedCategory("All Categories")}
                className="cursor-pointer font-medium text-[15px] text-slate-800 rounded-lg hover:bg-purple-50 hover:text-purple-700 p-2"
              >
                All Categories
              </DropdownMenuItem>
              {[...visibleCategories, ...moreCategories].map((name) => (
                <DropdownMenuItem
                  key={name}
                  onClick={() => setSelectedCategory(name)}
                  className="cursor-pointer font-medium text-[15px] text-slate-800 rounded-lg hover:bg-purple-50 hover:text-purple-700 p-2"
                >
                  {name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex-1 flex items-center relative h-full px-0 text-slate-700">
             <SearchInput
                initialValue={searchParams?.get("query") || ""}
                category={selectedCategory}
             />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3 md:gap-6">

          {/* 6. Notifications (Auth Only) */}
          {isMounted && user && (
            <div className="hidden sm:block">
              <NotificationBell />
            </div>
          )}

          {/* 7. User Account */}
          <DropdownMenu modal={false}>
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
                  <DropdownMenuItem asChild className="rounded-lg p-2.5 cursor-pointer font-medium text-[15px] text-slate-800 hover:bg-purple-50 hover:text-purple-700">
                    <Link href={user.role === "VENDOR" ? "/vendor/dashboard" : "/customer/dashboard"}>Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="rounded-lg p-2.5 cursor-pointer font-medium text-[15px] text-red-600 hover:bg-red-50 flex items-center gap-2">
                    Sign Out
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 8. Cart */}
          <Link href="/customer/cart" className="flex items-center gap-2 hover:bg-white/10 p-2 rounded-xl transition-all relative">
            <div className="relative">
              <ShoppingCart className="h-6 w-6 md:h-7 md:w-7" />
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-[#1B2533] font-bold text-[11px] h-5 w-5 rounded-full flex items-center justify-center shadow-md">
                {isMounted ? cartCount : 0}
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
