"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  UserCircle,
  X,
  LayoutDashboard,
  Package,
  Bell,
  ShoppingCart,
  Zap,
  MapPin
} from "lucide-react";
import Link from "next/link";
import { useCart } from "@/hooks/use-commerce";
import MainNavbar from "../navigation/MainNavbar";
import SubNavbar from "../navigation/SubNavbar";
import { visibleCategories, moreCategories } from "@/config/navigation/categories";
import { quickLinks } from "@/config/navigation/subNavigation";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { data: cartData } = useCart();
  const cartCount = cartData?.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogout = async () => {
    logout();
  };

  const allCategories = [...visibleCategories, ...moreCategories];

  return (
    <>
      <header className="flex flex-col w-full z-50 sticky top-0 shadow-lg border-b border-gray-100 overflow-hidden">
        <MainNavbar
          user={user}
          logout={handleLogout}
          cartCount={cartCount}
          isMounted={isMounted}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <SubNavbar />
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white z-[70] shadow-2xl flex flex-col"
            >
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

              <div className="flex-1 overflow-y-auto p-4 space-y-8 pb-10">
                {/* 1. Primary Navigation */}
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2">Navigation</h3>
                  <div className="space-y-1">
                    <Link
                      href="/marketplace"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                    >
                      All Events
                    </Link>
                    {isMounted && user && (
                      <>
                        {user.role === "VENDOR" && (
                          <Link
                            href="/vendor/dashboard"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-3 rounded-xl text-primary font-bold hover:bg-purple-50 transition-colors"
                          >
                            <LayoutDashboard className="h-5 w-5" /> Vendor Dashboard
                          </Link>
                        )}
                        <Link
                          href={user.role === "VENDOR" ? "/vendor/bookings" : "/customer/bookings"}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                        >
                          <Package className="h-5 w-5" /> My Orders
                        </Link>
                        <Link
                          href={user.role === "VENDOR" ? "/vendor/notifications" : "/customer/notifications"}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                        >
                          <Bell className="h-5 w-5" /> Notifications
                        </Link>
                      </>
                    )}
                    <Link
                      href="/customer/cart"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-3 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ShoppingCart className="h-5 w-5" /> My Cart
                      </div>
                      <span className="bg-yellow-400 text-black px-2 py-0.5 rounded-full text-[10px]">{cartCount}</span>
                    </Link>
                  </div>
                </div>

                {/* 2. Quick Links */}
                <div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2">Quick Links</h3>
                   <div className="grid grid-cols-2 gap-2">
                     {quickLinks.map(link => (
                        <Link
                          key={link.name}
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-xl border border-slate-100 text-[11px] font-black uppercase transition-all hover:border-primary/20 hover:bg-primary/5",
                            link.name === "Offers" ? "text-red-500 bg-red-50/50" : "text-slate-600"
                          )}
                        >
                          {link.name === "Near Me" && <MapPin className="h-3.5 w-3.5" />}
                          {link.name === "Offers" && <Zap className="h-3.5 w-3.5 fill-red-500" />}
                          {link.name}
                        </Link>
                     ))}
                   </div>
                </div>

                {/* 3. Categories */}
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2">Event Categories</h3>
                  <div className="space-y-1">
                    {allCategories.map((name) => (
                      <Link
                        key={name}
                        href={`/marketplace?category=${encodeURIComponent(name)}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-3 py-2.5 text-[14px] text-slate-600 font-medium hover:text-primary transition-colors border-l-2 border-transparent hover:border-primary pl-4"
                      >
                        {name}
                      </Link>
                    ))}
                  </div>
                </div>

                {!user && (
                   <div className="pt-4 border-t border-slate-100">
                      <Link
                        href="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block w-full bg-primary text-white text-center py-4 rounded-xl font-bold shadow-lg shadow-primary/20"
                      >
                        Sign In / Register
                      </Link>
                   </div>
                )}

                {user && (
                   <button
                     onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                     }}
                     className="w-full text-red-500 font-bold py-4 rounded-xl border border-red-100 hover:bg-red-50 transition-colors"
                   >
                     Sign Out
                   </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
