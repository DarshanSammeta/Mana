"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { customerService } from "@/services";
import {
  ChevronRight,
  ShieldCheck,
  Wallet,
  ArrowRight,
  Sparkles,
  Star,
  Search,
  Zap,
  HelpCircle,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import CountUp from "react-countup";
import { optimizeImage } from "@/lib/cloudinary";
import Image from "next/image";
import { CustomerStats } from "@/types";
import { CUSTOMER_QUICK_LINKS, SMART_MATCH_FALLBACKS } from "@/data/dashboard/customer-dashboard";
import { RecentlyViewed } from "@/components/home/RecentlyViewed";

interface CustomerDashboardClientProps {
  initialStats: CustomerStats;
}

export default function CustomerDashboardClient({ initialStats }: CustomerDashboardClientProps) {
  const { user } = useAuthStore();

  const { data: stats } = useQuery({
    queryKey: ["customer-stats"],
    queryFn: () => customerService.getStats(),
    initialData: initialStats,
    refetchOnMount: false // Since we hydrated with SSR data
  });

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">Welcome back, {user?.fullName?.split(' ')[0] || 'there'}!</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1 font-medium">Here&apos;s what&apos;s happening with your events.</p>
        </div>
        <div className="w-full md:w-auto bg-white border border-slate-200 rounded-2xl p-4 md:p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
           <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary">
              <Wallet className="h-6 w-6" />
           </div>
           <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Wallet Balance</p>
              <p className="text-xl font-extrabold text-slate-900">₹<CountUp end={stats?.walletBalance || 0} decimals={2} duration={1} /></p>
           </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CUSTOMER_QUICK_LINKS.map((link) => (
          <Link key={link.title} href={link.href}>
            <div className="group h-full bg-white border border-slate-200 hover:border-primary/30 p-6 rounded-2xl transition-all hover:shadow-xl hover:shadow-primary/5 cursor-pointer relative overflow-hidden">
              <div className={cn("inline-flex p-3 rounded-xl mb-4 group-hover:scale-110 transition-transform", link.bg, link.color)}>
                 <link.icon className="h-6 w-6" />
              </div>
              <div className="relative z-10">
                 <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">{link.title}</h3>
                 <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">{link.desc}</p>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <ChevronRight className="h-5 w-5 text-primary" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-8 md:gap-12 border-t border-slate-100 pt-8 md:pt-12">
        {/* Left: Recent Activity / Orders */}
        <div className="lg:col-span-8 space-y-8 md:space-y-10">
           <section>
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <div className="flex items-center gap-3">
                   <h2 className="text-xl md:text-2xl font-bold text-slate-900">Active Bookings</h2>
                   {stats?.activeBookings > 0 && (
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {stats.activeBookings} Active
                      </span>
                   )}
                </div>
                <Link href="/customer/orders" className="text-sm text-primary hover:text-blue-700 font-bold flex items-center gap-1.5 group">
                  View all <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {stats?.recentBookings?.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {stats.recentBookings.map((booking: any) => (
                    <Link key={booking.id} href={`/customer/orders/${booking.id}`}>
                      <div className="border border-slate-200 rounded-2xl p-5 flex gap-5 hover:border-primary/30 hover:shadow-lg transition-all bg-white group">
                          <div className="h-20 w-20 bg-slate-50 rounded-xl flex items-center justify-center font-bold text-slate-400 text-2xl shrink-0 border border-slate-100 overflow-hidden relative">
                            {booking.vendorLogo ? (
                               <Image
                                 src={optimizeImage(booking.vendorLogo, 'avatar')}
                                 alt={booking.vendorName}
                                 fill
                                 className="object-cover"
                                 sizes="80px"
                               />
                            ) : (
                               booking.vendorName.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                                <span className={cn(
                                   "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                                   booking.status === 'EVENT_STARTED' ? 'bg-indigo-100 text-indigo-700' :
                                   booking.status === 'EVENT_COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                   ['VENDOR_TRAVELING', 'VENDOR_ARRIVED'].includes(booking.status) ? 'bg-blue-100 text-blue-700' :
                                   'bg-slate-100 text-slate-700'
                                )}>
                                  {booking.status.replace(/_/g, ' ')}
                                </span>
                                <span className="text-[11px] font-bold text-slate-400">{format(new Date(booking.eventDate), 'MMM dd, yyyy')}</span>
                            </div>
                            <h4 className="text-base font-bold text-slate-900 truncate group-hover:text-primary transition-colors">{booking.vendorName}</h4>
                            <p className="text-sm text-slate-500 truncate mt-0.5">{booking.serviceTitle}</p>
                            <div className="mt-4 flex items-center justify-between">
                               <p className="text-base font-bold text-slate-900">₹{Number(booking.totalAmount).toLocaleString()}</p>
                               <span className="text-xs text-primary font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                 Details <ArrowRight className="h-3 w-3" />
                               </span>
                            </div>
                          </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 md:py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 px-6">
                   <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                      <Search className="h-7 w-7 text-slate-400" />
                   </div>
                   <h3 className="text-lg font-bold text-slate-900">No bookings yet</h3>
                   <p className="text-sm text-slate-500 mt-2 mb-8 max-w-xs mx-auto leading-relaxed">Discover professional vendors and start planning your perfect event today.</p>
                   <Link href="/marketplace">
                      <Button className="w-full md:w-auto bg-primary hover:bg-blue-700 text-white font-bold rounded-xl px-8 py-6 h-auto shadow-lg shadow-primary/20">
                        Explore Marketplace
                      </Button>
                   </Link>
                </div>
              )}
           </section>

           <section className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                 <Zap className="h-48 w-48 text-primary" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                 <div className="space-y-3 text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-3">
                       <span className="bg-primary text-white text-[10px] font-black px-2.5 py-1 rounded-md tracking-wider">EXCLUSIVE OFFER</span>
                       <h3 className="text-2xl font-bold">Smart Match Savings</h3>
                    </div>
                    <p className="text-slate-300 text-sm md:text-base max-w-md">Get up to <span className="text-white font-bold">15% off</span> service fees when you book through our smart recommendation engine.</p>
                 </div>
                 <Link href="/marketplace" className="w-full md:w-auto">
                    <Button className="w-full md:w-auto bg-white text-slate-900 hover:bg-slate-100 font-extrabold rounded-xl px-8 py-6 h-auto border-none shadow-xl">
                       START PLANNING
                    </Button>
                 </Link>
              </div>
           </section>

           <div className="-mx-6 md:-mx-10 border-t border-slate-100 pt-8 md:pt-12">
              <RecentlyViewed />
           </div>
        </div>

        {/* Right: Sidebar Content */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="font-bold text-lg text-slate-900">Smart Match</h3>
                 <span className="text-[10px] font-black text-primary bg-blue-50 px-2 py-1 rounded-md tracking-wider">AI POWERED</span>
              </div>
              <div className="space-y-6">
                 {SMART_MATCH_FALLBACKS.map((item, i) => (
                    <div key={i} className="flex gap-4 group cursor-pointer items-start">
                       <div className="h-16 w-16 bg-slate-50 rounded-xl shrink-0 flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 transition-colors">
                          <Sparkles className="h-7 w-7 text-slate-300 group-hover:text-primary/40 transition-colors" />
                       </div>
                       <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between mb-1">
                             <p className="text-[10px] font-black text-primary uppercase tracking-widest">{item.category}</p>
                             <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded">
                                <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                                <span className="text-[10px] text-amber-700 font-bold">{item.rating}</span>
                             </div>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors truncate">{item.name}</h4>
                          <div className="flex items-center justify-between mt-2">
                             <span className="text-xs font-bold text-slate-700">{item.price}</span>
                             <span className="text-[11px] text-slate-400 font-medium">{item.reviews} reviews</span>
                          </div>
                       </div>
                    </div>
                 ))}
                 <Button variant="ghost" className="w-full text-primary hover:text-blue-700 hover:bg-blue-50 text-sm font-bold mt-2 rounded-xl py-6 h-auto">
                    View more matches
                 </Button>
              </div>
           </div>

           <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Support & Help</h3>
              <div className="space-y-1">
                {[
                  { icon: HelpCircle, label: "Help Center", href: "/support" },
                  { icon: Settings, label: "Account Settings", href: "/customer/settings" },
                  { icon: ShieldCheck, label: "Safety & Privacy", href: "/privacy" }
                ].map((item, i) => (
                  <Link key={i} href={item.href} className="flex items-center gap-3 p-3.5 rounded-xl text-slate-600 hover:text-primary hover:bg-white hover:shadow-sm transition-all group">
                    <item.icon className="h-5 w-5 opacity-70 group-hover:opacity-100" />
                    <span className="text-sm font-bold group-hover:translate-x-1 transition-transform">{item.label}</span>
                  </Link>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
