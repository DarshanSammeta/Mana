"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/common/Navbar";
import {
  Star, MapPin, Clock, ShieldCheck, Heart, Share2,
  Calendar, Users, MessageSquare, Image as ImageIcon,
  CheckCircle2, Zap, Trophy, Play,
  ChevronDown,
  Map as MapIcon,
  ShoppingBag,
  Award,
  CalendarDays,
  Check,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";
import { useCommerceStore } from "@/store/commerceStore";
import { useAddToCart, useToggleWishlist } from "@/hooks/useCommerce";

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");

export default function VendorProfileClient({ vendor, similarVendors }: { vendor: any, similarVendors: any[] }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart: addToStore, toggleWishlist: toggleStore, wishlist } = useCommerceStore();
  const { user } = useAuthStore();
  const { mutate: addToCartApi, isPending: isAddingToCart } = useAddToCart();
  const { mutate: toggleWishlistApi, isPending: isTogglingWishlist } = useToggleWishlist();

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

  const currentService = vendor.service?.find((s: any) => s.id === selectedServiceId) || vendor.service?.[0];
  const currentPackage = currentService?.Renamedpackage?.find((p: any) => p.id === selectedPackageId) || currentService?.Renamedpackage?.[0];

  const images = vendor.portfolio?.length > 0
    ? vendor.portfolio.map((p: any) => p.mediaUrl)
    : [vendor.coverImage || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1000"];

  const basePrice = currentPackage?.price || currentService?.basePrice || 0;
  const isWishlisted = wishlist.some(i => i.targetId === vendor.id);

  const handleAddToCart = () => {
    if (user) {
      addToCartApi({ type: "SERVICE", targetId: vendor.id, quantity: 1 });
    } else {
      addToStore({
        id: Math.random().toString(36).substr(2, 9),
        type: "SERVICE",
        targetId: vendor.id,
        quantity: 1,
        details: { title: vendor.businessName, price: Number(basePrice), image: vendor.coverImage }
      });
    }
  };

  const handleToggleWishlist = () => {
    if (user) {
      toggleWishlistApi({ type: "SERVICE", targetId: vendor.id });
    } else {
      toggleStore({ type: "SERVICE", targetId: vendor.id });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex flex-col font-sans text-[#475569]">
      <Navbar />

      {/* Breadcrumbs */}
      <nav className="bg-[#FFFFFF] px-4 py-3 text-[13px] text-[#94A3B8] border-b border-[#E2E8F0] hidden sm:block">
        <div className="max-w-[1500px] mx-auto flex items-center gap-2">
          <Link href="/marketplace" className="hover:text-[#5B7CFA] transition-colors font-medium">Marketplace</Link>
          <ChevronRight className="h-3.5 w-3.5 text-[#E2E8F0]" />
          <span className="hover:text-[#5B7CFA] cursor-pointer transition-colors font-medium">
            {currentService?.servicetype?.subcategory?.category?.name || "Services"}
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-[#E2E8F0]" />
          <span className="text-[#1E293B] font-bold">{vendor.businessName}</span>
        </div>
      </nav>

      <main className="flex-1 max-w-[1500px] mx-auto w-full px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Left: Image Gallery */}
          <div className="flex flex-col md:flex-row gap-6 lg:w-[48%]">
            <div className="hidden md:flex flex-col gap-3 shrink-0">
              {images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onMouseEnter={() => setSelectedImage(idx)}
                  className={cn(
                    "w-20 h-20 border-2 rounded-xl overflow-hidden shrink-0 transition-all relative shadow-sm",
                    selectedImage === idx ? "border-[#5B7CFA] ring-2 ring-[#5B7CFA]/20" : "border-[#E2E8F0] hover:border-[#5B7CFA]/40"
                  )}
                >
                  <Image src={img} fill sizes="80px" className="object-cover" alt={`Thumb ${idx}`} />
                </button>
              ))}
            </div>

            <div className="flex-1 bg-[#FFFFFF] rounded-2xl overflow-hidden border border-[#E2E8F0] aspect-square relative group shadow-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full relative"
                >
                  <Image src={images[selectedImage]} fill priority={selectedImage === 0} sizes="(max-width: 768px) 100vw, 48vw" className="object-contain" alt={vendor.businessName} />
                </motion.div>
              </AnimatePresence>
              <div className="absolute top-4 right-4 z-10">
                 <button
                    onClick={handleToggleWishlist}
                    className={cn(
                      "h-10 w-10 rounded-full bg-[#FFFFFF]/90 backdrop-blur-sm shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-90 border border-[#E2E8F0]",
                      isWishlisted ? "text-destructive" : "text-[#94A3B8] hover:text-destructive"
                    )}
                 >
                    <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
                 </button>
              </div>
            </div>
          </div>

          {/* Center: Details */}
          <div className="flex-1 space-y-6">
            <div className="border-b border-[#E2E8F0] pb-6">
              <div className="flex items-center gap-2 mb-2">
                 {vendor.verificationStatus === "APPROVED" && (
                   <Badge variant="outline" className="bg-[#5B7CFA]/5 text-[#5B7CFA] border-[#5B7CFA]/20 gap-1 rounded-full px-3 py-1 font-bold">
                     <ShieldCheck className="h-3.5 w-3.5" /> Verified Partner
                   </Badge>
                 )}
                 <Badge variant="outline" className="bg-[#F8FAFC] text-[#94A3B8] border-[#E2E8F0] rounded-full px-3 py-1 font-bold">
                   {currentService?.servicetype?.name || "Professional"}
                 </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-[#1E293B] tracking-tight mb-3">{vendor.businessName}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 font-bold text-[#1E293B]">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < Math.floor(vendor.rating || 4.5) ? 'fill-yellow-400 text-yellow-400' : 'text-[#E2E8F0]'}`} />
                    ))}
                  </div>
                  <span className="text-base">{vendor.rating || "4.5"}</span>
                </div>
                <div className="h-4 w-px bg-[#E2E8F0]" />
                <span className="text-sm font-semibold text-[#5B7CFA] hover:underline cursor-pointer">{vendor.reviewCount || 0} customer reviews</span>
                <div className="h-4 w-px bg-[#E2E8F0]" />
                <div className="flex items-center gap-1.5 text-sm text-[#94A3B8] font-medium">
                  <MapPin className="h-4 w-4" /> {vendor.city}
                </div>
              </div>
            </div>

            <div className="border-b border-[#E2E8F0] pb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-[#94A3B8] uppercase tracking-widest">Starts from</span>
                <span className="text-4xl font-black text-[#1E293B]">₹{basePrice.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-sm font-medium text-[#22C55E] mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> In stock & available for bookings
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#1E293B] uppercase tracking-tight">About this vendor</h3>
              <p className="text-[#475569] leading-relaxed text-base font-medium">{vendor.description}</p>
            </div>

            <div className="pt-6 border-t border-[#E2E8F0]">
               <h3 className="text-lg font-bold text-[#1E293B] mb-4 uppercase tracking-tight">Select Package</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {vendor.service?.map((service: any) =>
                    service.Renamedpackage?.map((pkg: any) => (
                      <button
                        key={pkg.id}
                        onClick={() => { setSelectedServiceId(service.id); setSelectedPackageId(pkg.id); }}
                        className={cn(
                          "p-5 border-2 rounded-2xl text-left transition-all duration-300 relative group",
                          selectedPackageId === pkg.id
                            ? "border-[#5B7CFA] bg-[#5B7CFA]/5 shadow-sm"
                            : "border-[#E2E8F0] hover:border-[#5B7CFA]/30 hover:bg-[#FFFFFF]"
                        )}
                      >
                         <div className="flex justify-between items-start mb-2">
                            <p className={cn("text-xs font-black uppercase tracking-widest", selectedPackageId === pkg.id ? "text-[#5B7CFA]" : "text-[#94A3B8]")}>{pkg.name}</p>
                            {selectedPackageId === pkg.id && (
                              <div className="bg-[#5B7CFA] text-[#FFFFFF] p-1 rounded-full">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                         </div>
                         <p className="text-2xl font-black text-[#1E293B]">₹{Number(pkg.price).toLocaleString('en-IN')}</p>
                         <p className="text-xs font-medium text-[#94A3B8] mt-2 line-clamp-1">{pkg.description || "Full service package with premium features"}</p>
                      </button>
                    ))
                  )}
               </div>
            </div>
          </div>

          {/* Right: Sidebar */}
          <aside className="w-full lg:w-96 shrink-0">
             <div className="sticky top-32 space-y-6">
                <Card className="overflow-hidden border-2 border-[#E2E8F0] shadow-xl rounded-2xl bg-[#FFFFFF]">
                   <div className="p-6 bg-[#F8FAFC]/50 border-b border-[#E2E8F0]">
                      <div className="flex items-center justify-between mb-4">
                         <span className="text-sm font-bold text-[#94A3B8] uppercase tracking-widest">Selected Price</span>
                         <Badge className="bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20 font-bold">Best Price</Badge>
                      </div>
                      <div className="flex items-baseline gap-2">
                         <span className="text-4xl font-black text-[#1E293B]">₹{basePrice.toLocaleString('en-IN')}</span>
                      </div>
                      <p className="text-xs font-bold text-[#94A3B8] mt-2">FREE cancellation within 48 hours</p>
                   </div>

                   <div className="p-6 space-y-4">
                      <div className="space-y-3">
                         <div className="flex items-center gap-3 text-sm font-semibold text-[#475569]">
                            <CalendarDays className="h-5 w-5 text-[#5B7CFA]" />
                            <span>Select dates for availability</span>
                         </div>
                         <div className="flex items-center gap-3 text-sm font-semibold text-[#475569]">
                            <ShoppingBag className="h-5 w-5 text-[#5B7CFA]" />
                            <span>Package: {currentPackage?.name || "Standard"}</span>
                         </div>
                      </div>

                      <div className="pt-4 space-y-3">
                        <Link href={`/customer/checkout?vendorId=${vendor.id}&serviceId=${selectedServiceId}${selectedPackageId ? `&packageId=${selectedPackageId}` : ""}`} className="block">
                           <Button className="w-full h-12 bg-[#5B7CFA] hover:bg-[#4C6EF5] text-[#FFFFFF] font-bold rounded-full shadow-sm transition-all active:scale-95 text-base border-none">
                              Book Now
                           </Button>
                        </Link>
                        <Button
                            onClick={handleAddToCart}
                            variant="outline"
                            className="w-full h-12 bg-[#FFFFFF] hover:bg-[#F8FAFC] text-[#334155] font-bold rounded-full border border-[#E2E8F0] transition-all shadow-sm"
                            isLoading={isAddingToCart}
                        >
                            Add to Shortlist
                        </Button>
                      </div>

                      <div className="pt-4 flex items-center gap-2 justify-center">
                         <Award className="h-4 w-4 text-[#5B7CFA]" />
                         <span className="text-[11px] font-black uppercase tracking-widest text-[#94A3B8]">100% Secure Booking</span>
                      </div>
                   </div>
                </Card>

                <div className="bg-[#1E293B] rounded-2xl p-6 text-[#FFFFFF] shadow-lg relative overflow-hidden group">
                   <div className="relative z-10">
                      <h4 className="text-lg font-bold mb-2 flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-[#6FCF97]" /> Exclusive Offer
                      </h4>
                      <p className="text-[#94A3B8] text-sm font-medium mb-4">Book today and get a complimentary drone session for your event.</p>
                      <button className="text-xs font-black uppercase tracking-widest text-[#6FCF97] hover:underline">Learn more</button>
                   </div>
                   <div className="absolute top-0 right-0 w-24 h-24 bg-[#5B7CFA]/20 blur-3xl rounded-full -mr-12 -mt-12 transition-all group-hover:bg-[#5B7CFA]/40" />
                </div>
             </div>
          </aside>
        </div>

        {/* Similar Vendors */}
        <section className="mt-24 border-t border-[#E2E8F0] pt-16">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black text-[#1E293B] tracking-tight">Similar Professionals</h2>
            <Link href="/marketplace" className="text-sm font-bold text-[#5B7CFA] hover:underline">View all experts</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
               {similarVendors.slice(0, 4).map((v: any) => (
               <Link key={v.id} href={`/marketplace/vendor/${v.id}`} className="group flex flex-col">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-[#F8FAFC] mb-4 relative border border-[#E2E8F0] shadow-sm transition-all group-hover:shadow-md group-hover:-translate-y-1">
                     <Image src={v.coverImage || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800"} fill className="object-cover transition-transform duration-700 group-hover:scale-110" alt={v.businessName} />
                  </div>
                  <h4 className="font-bold text-[#1E293B] group-hover:text-[#5B7CFA] transition-colors truncate mb-1">{v.businessName}</h4>
                  <div className="flex items-center justify-between">
                     <p className="text-sm font-black text-[#1E293B]">From ₹{Number(v.basePrice).toLocaleString('en-IN')}</p>
                     <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-bold text-[#475569]">{v.rating || "4.8"}</span>
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
