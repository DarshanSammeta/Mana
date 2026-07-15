"use client";

import { useState, useEffect, memo } from "react";
import {
  Star, MapPin, ShieldCheck, Heart,
  Trophy,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";
import { useCommerceStore } from "@/store/commerceStore";
import { useToggleWishlist } from "@/hooks/useCommerce";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { cn } from "@/lib/utils";
import BookingWizard from "@/components/booking/BookingWizard";
import { optimizeImage } from "@/lib/cloudinary";

function VendorProfileClientContent({
  vendor,
  similarVendors,
}: {
  vendor: any,
  similarVendors: any[],
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
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

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);

  useEffect(() => {
    if (vendor?.service?.[0]) {
      setSelectedServiceId(vendor.service[0].id);
      if (vendor.service[0].Renamedpackage?.[0]) {
        setSelectedPackageId(vendor.service[0].Renamedpackage[0].id);
      }
    }
  }, [vendor]);

  const currentService = vendor.service?.find((s: { id: string }) => s.id === selectedServiceId) || vendor.service?.[0];
  const currentPackage = currentService?.Renamedpackage?.find((p: { id: string }) => p.id === selectedPackageId) || currentService?.Renamedpackage?.[0];

  const images = vendor.portfolio?.length > 0
    ? vendor.portfolio.map((p: any) => p.mediaUrl)
    : [vendor.coverImage || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1000"];

  const basePrice = currentPackage?.price || currentService?.basePrice || 0;
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
          <span className="hover:text-blue-600 cursor-pointer transition-colors font-bold uppercase tracking-wider">
            {currentService?.servicetype?.subcategory?.category?.name || "Services"}
          </span>
          <ChevronRight className="h-3 w-3 text-slate-300" />
          <span className="text-slate-900 font-black uppercase tracking-wider">{vendor.businessName}</span>
        </div>
      </nav>

      <main className="flex-1 max-w-[1500px] mx-auto w-full px-4 lg:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* Left Content Area (Columns 1-9) */}
          <div className="lg:col-span-9 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-9 gap-10 items-start">

              {/* Image Gallery (lg:col-span-6 of the 9-col container) */}
              <div className="lg:col-span-6 flex flex-col md:flex-row gap-6">
                <div className="hidden md:flex flex-col gap-4 shrink-0">
                  {images.slice(0, 5).map((img: string, idx: number) => (
                    <button
                      key={idx}
                      onMouseEnter={() => setSelectedImage(idx)}
                      className={cn(
                        "w-24 h-24 border-2 rounded-xl overflow-hidden shrink-0 transition-all relative shadow-sm",
                        selectedImage === idx ? "border-blue-600 ring-4 ring-blue-50" : "border-slate-100 hover:border-blue-200"
                      )}
                    >
                      <Image
                        src={optimizeImage(img, 'avatar')}
                        fill
                        sizes="96px"
                        className="object-cover"
                        alt={`Thumb ${idx}`}
                      />
                    </button>
                  ))}
                </div>

                <div className="flex-1 bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 aspect-[3/2] relative group shadow-2xl">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedImage}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="w-full h-full relative"
                    >
                      <Image
                        src={optimizeImage(images[selectedImage], 'gallery')}
                        fill
                        priority={selectedImage === 0}
                        sizes="(max-width: 768px) 100vw, 45vw"
                        className="object-cover"
                        alt={vendor.businessName}
                      />
                    </motion.div>
                  </AnimatePresence>
                  <div className="absolute top-6 right-6 z-10">
                     <button
                        onClick={handleToggleWishlist}
                        className={cn(
                          "h-12 w-12 rounded-full bg-white/95 backdrop-blur-sm shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 border border-slate-100",
                          isWishlisted ? "text-red-500" : "text-slate-400 hover:text-red-500"
                        )}
                     >
                        <Heart className={cn("h-6 w-6", isWishlisted && "fill-current")} />
                     </button>
                  </div>
                </div>
              </div>

              {/* Vendor Details (lg:col-span-3 of the 9-col container) */}
              <div className="lg:col-span-3 flex flex-col gap-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                     {vendor.verificationStatus === "APPROVED" && (
                       <div className="bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-200">
                         <ShieldCheck className="h-3.5 w-3.5 fill-white text-blue-600" />
                         Verified
                       </div>
                     )}
                     <Badge className="bg-slate-100 text-slate-600 border-none rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest">
                       {currentService?.servicetype?.name || "Professional"}
                     </Badge>
                  </div>

                  <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{vendor.businessName}</h1>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 bg-orange-50 w-fit px-3 py-1.5 rounded-xl border border-orange-100">
                      <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
                      <span className="text-sm font-black text-orange-700">{vendor.rating || "4.8"}</span>
                      <span className="text-xs font-bold text-orange-400">({vendor.reviewCount || "24"})</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-500 font-bold">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{vendor.city}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">About Vendor</h3>
                  <p className="text-slate-600 leading-relaxed text-sm font-medium line-clamp-[8]">{vendor.description}</p>
                </div>
              </div>
            </div>

            {/* Booking Wizard (Occupies full 9 columns) */}
            <div className="pt-12 border-t border-slate-100">
               <BookingWizard vendor={vendor} />
            </div>
          </div>

          {/* Right Column: Fixed Booking & Offer Cards (Columns 10-12) */}
          <div className="lg:col-span-3 flex flex-col gap-6 sticky top-32">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl">
              <div className="mb-6">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Pricing starts from</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">₹{basePrice.toLocaleString('en-IN')}</span>
                  <span className="text-xs font-bold text-slate-400">/ event</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Accepting {new Date().getFullYear()} Bookings</span>
                </div>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-200 transition-all">
                Check Availability
              </Button>
            </div>

            <div className="p-6 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] text-white shadow-xl shadow-blue-200">
               <div className="flex items-center gap-2 mb-3">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Premium Partner</span>
               </div>
               <p className="text-xs font-bold leading-relaxed opacity-90">This vendor is among our top-rated professionals with 100% response rate.</p>
            </div>
          </div>
        </div>

        {/* Similar Vendors Section */}
        <section className="mt-20 pt-20 border-t border-slate-100">
          <div className="flex items-end justify-between mb-12">
            <div className="space-y-2">
               <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Similar Professionals</h2>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Based on your current interest</p>
            </div>
            <Link href="/marketplace">
               <Button variant="outline" className="rounded-full px-8 font-black uppercase tracking-widest text-[11px] border-slate-200 hover:bg-slate-50 h-12 transition-all">
                  See All Experts
               </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
               {similarVendors.slice(0, 4).map((v: any) => (
               <Link key={v.id} href={`/marketplace/vendor/${v.id}`} className="group flex flex-col">
                  <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-50 mb-6 relative border border-slate-100 shadow-sm transition-all duration-500 group-hover:shadow-2xl group-hover:-translate-y-2">
                     <Image
                        src={optimizeImage(v.coverImage, 'card') || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800"}
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                        alt={v.businessName}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 25vw, 300px"
                     />
                     <div className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center border border-slate-100">
                        <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
                     </div>
                  </div>
                  <h4 className="font-black text-lg text-slate-900 group-hover:text-blue-600 transition-colors truncate mb-1 tracking-tight">{v.businessName}</h4>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Starts at</span>
                        <span className="text-lg font-black text-slate-900">₹{Number(v.basePrice).toLocaleString('en-IN')}</span>
                     </div>
                     <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md">Verified</span>
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
