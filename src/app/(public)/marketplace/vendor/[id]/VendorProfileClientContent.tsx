"use client";

import { useState, useEffect, memo } from "react";
import {
  Star, MapPin, Heart,
  Trophy,
  ChevronRight,
  ArrowRight,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";
import { useCommerceStore } from "@/store/commerceStore";
import { useToggleWishlist } from "@/hooks/use-commerce";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { cn, formatCurrency } from "@/lib/utils";
import { optimizeImage } from "@/lib/cloudinary";
import { ServiceCard } from "@/components/marketplace/ServiceCard";

function VendorProfileClientContent({
  vendor,
  similarVendors,
}: {
  vendor: any,
  similarVendors: any[],
}) {
  const [isMounted, setIsMounted] = useState(false);
  const { wishlist, toggleWishlist: toggleStore } = useCommerceStore();
  const { trackView } = useRecentlyViewed();

  useEffect(() => {
    setIsMounted(true);
    if (vendor) {
      trackView(vendor);
    }
  }, [vendor, trackView]);

  const { user } = useAuthStore();
  const { mutate: toggleWishlistApi } = useToggleWishlist();

  const images = vendor.portfolio?.length > 0
    ? vendor.portfolio.map((p: any) => p.mediaUrl)
    : [vendor.coverImage || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1000"];

  const isWishlisted = isMounted && wishlist.some(i => i.targetId === vendor.id);

  const handleToggleWishlist = () => {
    if (user) {
      toggleWishlistApi({ type: "SERVICE", targetId: vendor.id });
    } else {
      toggleStore({ type: "SERVICE", targetId: vendor.id });
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-600">

      {/* Breadcrumbs */}
      <nav className="bg-slate-50 px-4 py-4 text-[12px] text-slate-400 border-b border-slate-100 hidden sm:block">
        <div className="max-w-[1500px] mx-auto flex items-center gap-3">
          <Link href="/marketplace" className="hover:text-blue-600 transition-colors font-bold uppercase tracking-wider">Marketplace</Link>
          <ChevronRight className="h-3 w-3 text-slate-300" />
          <span className="text-slate-900 font-black uppercase tracking-wider">{vendor.businessName} Store</span>
        </div>
      </nav>

      <main className="flex-1 max-w-[1500px] mx-auto w-full px-4 lg:px-6 py-10">

        {/* Vendor Header Hero */}
        <div className="relative h-[400px] rounded-[3rem] overflow-hidden mb-12 shadow-2xl border border-slate-100">
            <Image
                src={vendor.coverImage || images[0]}
                fill
                className="object-cover"
                alt={vendor.businessName}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute bottom-10 left-10 right-10 flex flex-col md:flex-row items-end justify-between gap-6">
                <div className="flex items-center gap-8 text-white">
                    <div className="h-24 w-24 rounded-3xl bg-white p-1 shadow-2xl">
                        <div className="h-full w-full rounded-[1.2rem] bg-slate-50 relative overflow-hidden">
                            <Image src={vendor.logo || "/logo-placeholder.png"} fill className="object-cover" alt="logo" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black italic uppercase tracking-tight leading-none">{vendor.businessName}</h1>
                            {vendor.verificationStatus === "APPROVED" && (
                                <BadgeCheck className="h-6 w-6 text-blue-400 fill-white" />
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] opacity-80">
                            <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {vendor.city}</div>
                            <div className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 fill-orange-400 text-orange-400" /> {vendor.rating || "4.8"} ({vendor.reviewCount || 24} Reviews)</div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={handleToggleWishlist}
                        className={cn(
                            "h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20",
                            isWishlisted && "text-red-500 fill-current"
                        )}
                    >
                        <Heart className={cn("h-6 w-6", isWishlisted && "fill-current")} />
                    </Button>
                    <Button className="h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/40">
                        Follow Store
                    </Button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

          {/* Left: About & Stats */}
          <div className="lg:col-span-4 space-y-12 sticky top-32">
            <section className="space-y-6">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] italic">About Professional</h3>
                <p className="text-slate-500 font-medium leading-relaxed text-lg italic pr-10 border-l-4 border-primary/20 pl-6">
                    {vendor.description || "Leading event professional dedicated to creating unforgettable experiences through excellence and innovation."}
                </p>

                <div className="grid grid-cols-2 gap-4 pt-6">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Experience</p>
                        <p className="text-xl font-black text-slate-900">{vendor.experienceYears || 5}+ Years</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Bookings</p>
                        <p className="text-xl font-black text-slate-900">{vendor.totalBookings || 100}+ Events</p>
                    </div>
                </div>
            </section>

            <section className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] text-white shadow-2xl">
                 <div className="flex items-center gap-3 mb-4">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <span className="text-xs font-black uppercase tracking-widest">Premium Partner</span>
                 </div>
                 <p className="text-xs font-bold leading-relaxed opacity-70 mb-6 italic">
                    This store maintains a 100% response rate and exceptional service quality standards.
                 </p>
                 <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span>Reliability</span>
                        <span>99.9%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[99%]" />
                    </div>
                 </div>
            </section>
          </div>

          {/* Right: Service Grid (Brand Store) */}
          <div className="lg:col-span-8 space-y-12">
            <div className="flex items-end justify-between border-b border-slate-100 pb-8">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">All Services</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Browse full collection</p>
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {vendor.service?.length || 0} Products
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {vendor.service?.map((s: any, idx: number) => (
                    <ServiceCard
                        key={s.id}
                        index={idx}
                        service={{
                            id: s.id,
                            slug: s.title.toLowerCase().replace(/ /g, '-'),
                            title: s.title,
                            category: s.servicetype?.name || "Service",
                            startingPrice: Number(s.basePrice),
                            images: vendor.portfolio?.filter((p: any) => p.serviceId === s.id).map((p: any) => p.mediaUrl) || [vendor.coverImage],
                            rating: vendor.rating,
                            reviewCount: vendor.reviewCount,
                            vendor: {
                                id: vendor.id,
                                businessName: vendor.businessName,
                                city: vendor.city,
                                isVerified: vendor.verificationStatus === "APPROVED"
                            },
                            badges: vendor.featured ? ["Premium"] : []
                        }}
                    />
                ))}
            </div>

            {/* Portfolio / Lookbook */}
            <section className="pt-20 space-y-8">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] italic">Portfolio Lookbook</h3>
                <div className="columns-1 sm:columns-2 gap-4 space-y-4">
                    {vendor.portfolio?.map((p: any, i: number) => (
                        <div key={i} className="relative rounded-3xl overflow-hidden group cursor-zoom-in aspect-[3/2]">
                            <Image
                                src={optimizeImage(p.mediaUrl, 'gallery')}
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                alt="Portfolio item"
                                sizes="(max-width: 640px) 100vw, 50vw"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-[10px] font-black uppercase tracking-widest border border-white/40 px-4 py-2 rounded-full">View Details</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
          </div>

        </div>

        {/* Similar Vendors Section */}
        <section className="mt-40 pt-20 border-t border-slate-100">
            <div className="flex items-end justify-between mb-16">
            <div className="space-y-2">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">More Professionals</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Recommended based on your interest</p>
            </div>
            <Link href="/marketplace">
                <Button variant="outline" className="rounded-2xl px-10 font-black uppercase tracking-widest text-[11px] border-slate-200 hover:bg-slate-50 h-14 transition-all">
                    Explore Marketplace <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                {similarVendors.slice(0, 4).map((v: any) => (
                <Link key={v.id} href={`/marketplace/vendor/${v.id}`} className="group flex flex-col">
                    <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-slate-50 mb-6 relative border border-slate-100 shadow-sm transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2">
                        <Image
                        src={optimizeImage(v.coverImage, 'card') || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800"}
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                        alt={v.businessName}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 25vw, 300px"
                        />
                        <div className="absolute top-6 right-6 h-10 w-10 rounded-2xl bg-white/90 backdrop-blur-sm flex items-center justify-center border border-slate-100 shadow-xl">
                            <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
                        </div>
                    </div>
                    <div className="px-4">
                        <h4 className="font-black text-xl text-slate-900 group-hover:text-primary transition-colors truncate mb-1 tracking-tight italic uppercase">{v.businessName}</h4>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Starts</span>
                                <span className="text-lg font-black text-slate-900">{formatCurrency(v.basePrice)}</span>
                            </div>
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-lg">Verified</span>
                        </div>
                    </div>
                </Link>
                ))}
            </div>
        </section>
      </main>
    </div>
  );
}

export default memo(VendorProfileClientContent);
