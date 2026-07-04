"use client";

import { Star, MapPin, ShieldCheck, Heart, Info, Check, Zap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { optimizeImage } from "@/lib/cloudinary";
import { IMAGES } from "@/constants";

import { useCommerceStore } from "@/store/commerceStore";
import { useAuthStore } from "@/store/authStore";
import { useAddToCart, useToggleWishlist } from "@/hooks/useCommerce";

import { memo, useMemo } from "react";
import { useCompareStore } from "@/store/useCompareStore";

interface VendorCardProps {
  vendor: any;
  index: number;
  viewMode?: "grid" | "list";
  priority?: boolean;
}

const BLUR_DATA_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMzAwIDIwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YxZjVmOSIvPjwvc3ZnPg==";

export const VendorCard = memo(function VendorCard({ vendor, index, viewMode = "grid", priority = false }: VendorCardProps) {
  const { wishlist, addToCart: _addToStore, toggleWishlist: toggleStore } = useCommerceStore();
  const { addVendor, removeVendor, isInCompare } = useCompareStore();
  const { user } = useAuthStore();
  const { mutate: addToCartApi } = useAddToCart();
  const { mutate: toggleWishlistApi } = useToggleWishlist();

  const isWishlisted = wishlist.some(i => i.targetId === vendor.id);
  const optimizedCover = useMemo(() => optimizeImage(vendor.coverImage, viewMode === 'list' ? 'thumbnail' : 'card'), [vendor.coverImage, viewMode]);
  const basePrice = useMemo(() => vendor.service?.[0]?.basePrice ?? vendor.basePrice ?? vendor.minPrice, [vendor.service, vendor.basePrice, vendor.minPrice]);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (user) {
      toggleWishlistApi({ type: "SERVICE", targetId: vendor.id });
    } else {
      toggleStore({ type: "SERVICE", targetId: vendor.id });
    }
  };

  const isComparing = isInCompare(vendor.id);
  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isComparing) {
      removeVendor(vendor.id);
    } else {
      addVendor({
        id: vendor.id,
        businessName: vendor.businessName,
        coverImage: vendor.coverImage,
        rating: vendor.rating || 4.8,
        basePrice: basePrice,
        city: vendor.city || "Hyderabad",
        category: vendor.category?.name || vendor.tags?.[0]
      });
    }
  };

  const _handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (user) {
      addToCartApi({ type: "SERVICE", targetId: vendor.id, quantity: 1 });
    } else {
      _addToStore({
          id: Math.random().toString(36).substr(2, 9),
          type: "SERVICE",
          targetId: vendor.id,
          quantity: 1,
          details: {
              title: vendor.businessName,
              price: vendor.basePrice,
              image: vendor.coverImage
          }
      });
    }
  };
  if (viewMode === "list") {
    return (
      <div className="flex flex-col md:flex-row bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all group">
        <div className="relative w-full md:w-72 h-72 md:h-auto overflow-hidden bg-slate-50 shrink-0">
          <Link href={`/marketplace/vendor/${vendor.id}`}>
            <Image
              src={optimizedCover || IMAGES.DEFAULT_EVENT}
              alt={vendor.businessName}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, 300px"
              priority={priority}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          </Link>
          <button
            onClick={handleToggleWishlist}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={cn(
              "absolute top-4 right-4 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm border border-border flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-sm",
              isWishlisted ? "text-destructive" : "text-slate-400 hover:text-destructive"
            )}
          >
            <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
          </button>
          <button
            onClick={handleToggleCompare}
            className={cn(
              "absolute top-16 right-4 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm border border-border flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-sm",
              isComparing ? "text-blue-600" : "text-slate-400 hover:text-blue-600"
            )}
            title={isComparing ? "Remove from compare" : "Add to compare"}
          >
            <Check className={cn("h-5 w-5", isComparing ? "opacity-100" : "opacity-40")} />
          </button>
        </div>

        <div className="flex-1 p-6 md:p-8 flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <Link href={`/marketplace/vendor/${vendor.id}`}>
              <h3 className="text-xl font-bold text-foreground hover:text-primary transition-colors line-clamp-2">
                {vendor.businessName}
              </h3>
            </Link>

            <div className="flex items-center gap-2 mt-2 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(Number(vendor.rating)) ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-slate-200'}`} />
                ))}
              </div>
              <span className="text-sm font-semibold text-muted-foreground">({vendor.reviewCount || "24"} Reviews)</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {vendor.tags?.map((tag: string) => (
                <span key={tag} className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                  {tag}
                </span>
              ))}
            </div>

            <div className="space-y-3">
               <div className="flex items-center gap-2 text-sm text-card-foreground">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{vendor.city || "Hyderabad"}</span>
                  {vendor.distance !== undefined && vendor.distance !== Infinity && (
                    <span className="text-muted-foreground font-normal">• {vendor.distance.toFixed(1)} km away</span>
                  )}
               </div>
               {vendor.travelCharge > 0 && (
                 <div className="flex items-center gap-2 text-xs font-bold text-orange-600">
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    <span>Travel Charge: ₹{vendor.travelCharge.toFixed(0)} apply for your location</span>
                 </div>
               )}
               <div className="flex items-center gap-2 text-sm text-success font-bold">
                  <div className="h-5 w-5 rounded-full bg-success/10 flex items-center justify-center">
                    <Check className="h-3 w-3" />
                  </div>
                  <span>Available for your date</span>
               </div>
               {vendor.verificationStatus === "APPROVED" && (
                 <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest">
                    <ShieldCheck className="h-4 w-4" />
                    Mana Verified Partner
                 </div>
               )}
            </div>
          </div>

          <div className="w-full md:w-64 flex flex-col justify-between border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-8">
            <div>
               <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-semibold text-muted-foreground">Starting from</span>
                  <span className="text-3xl font-black text-foreground">₹{basePrice}</span>
               </div>
               <p className="text-xs text-muted-foreground mt-2 font-medium">Includes basic setup & professional consultation</p>
            </div>

               <div className="flex flex-col gap-3 mt-8">
                  <Link href={`/marketplace/vendor/${vendor.id}`}>
                    <Button
                      variant="outline"
                      className="w-full border-border bg-white hover:bg-hover text-card-foreground rounded-lg h-11 font-bold transition-all shadow-sm"
                    >
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/marketplace/vendor/${vendor.id}`}>
                    <Button className="w-full bg-primary hover:bg-blue-600 text-white border border-primary rounded-lg h-11 font-bold shadow-sm transition-all active:scale-95">
                      Check Availability
                    </Button>
                  </Link>
               </div>
          </div>
        </div>
      </div>
    );
  }

  // GRID VIEW (Professional Marketplace Style)
  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-500 group h-full hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
        <Link href={`/marketplace/vendor/${vendor.id}`}>
          <Image
            src={optimizedCover || IMAGES.DEFAULT_EVENT}
            alt={vendor.businessName}
            fill
            className="object-cover transition-transform duration-1000 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 300px"
            priority={priority}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        </Link>
        <div className="absolute top-3 left-3 flex flex-col gap-2">
           {vendor.verificationStatus === "APPROVED" && (
             <div className="bg-white/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-blue-500/20 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600 fill-blue-50" />
                <span className="text-[9px] font-black uppercase text-blue-700 tracking-wider">Verified</span>
             </div>
           )}
           {vendor.featured && (
              <div className="bg-[#F59E0B] text-white px-2 py-1 rounded-md shadow-sm flex items-center gap-1.5">
                 <Zap className="h-3 w-3 fill-current" />
                 <span className="text-[9px] font-black uppercase tracking-wider">Premium</span>
              </div>
           )}
        </div>
        <button
          onClick={handleToggleWishlist}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={cn(
            "absolute top-3 right-3 h-10 w-10 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200 flex items-center justify-center transition-all hover:bg-white hover:scale-110 active:scale-90 shadow-md z-10",
            isWishlisted ? "text-destructive" : "text-slate-400 hover:text-destructive"
          )}
        >
          <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
        </button>
        <button
          onClick={handleToggleCompare}
          className={cn(
            "absolute top-14 right-3 h-10 w-10 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200 flex items-center justify-center transition-all hover:bg-white hover:scale-110 active:scale-90 shadow-md z-10",
            isComparing ? "text-blue-600" : "text-slate-400 hover:text-blue-600"
          )}
          title={isComparing ? "Remove from compare" : "Add to compare"}
        >
           <Check className={cn("h-5 w-5", isComparing ? "opacity-100" : "opacity-40")} />
        </button>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
           <p className="text-white text-[10px] font-bold uppercase tracking-widest">{vendor.city || "Available Nationwide"}</p>
        </div>
      </div>

        <div className="flex-1 p-5 flex flex-col">
        <div className="flex justify-between items-start gap-3 mb-2">
           <Link href={`/marketplace/vendor/${vendor.id}`} className="flex-1">
             <h3 className="text-lg font-black text-[#111827] hover:text-blue-600 transition-colors line-clamp-1 leading-tight tracking-tight">
               {vendor.businessName}
             </h3>
           </Link>
           <div className="flex items-center gap-1.5 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100 shrink-0">
              <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
              <span className="text-xs font-black text-[#92400E]">{vendor.rating || "4.8"}</span>
           </div>
        </div>

        <div className="flex items-center gap-1.5 text-[12px] text-slate-500 mb-6 font-bold">
           <MapPin className="h-3.5 w-3.5 text-blue-500" />
           <span className="truncate">{vendor.city || "Contact for location"}</span>
           {vendor.distance !== undefined && vendor.distance !== Infinity && (
              <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md ml-1">
                {vendor.distance < 1 ? `${(vendor.distance * 1000).toFixed(0)}m` : `${vendor.distance.toFixed(1)}km`} away
              </span>
           )}
           <span className="text-slate-300 mx-1">•</span>
           <span className="truncate">{vendor.reviewCount || "24"} Reviews</span>
        </div>

        {vendor.travelCharge > 0 && (
          <div className="mb-4 flex items-center gap-2 text-[11px] font-bold text-orange-600 bg-orange-50 px-3 py-2 rounded-xl border border-orange-100">
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span>Travel Charge: ₹{vendor.travelCharge.toFixed(0)}</span>
            <Info className="h-3 w-3 ml-auto opacity-50" />
          </div>
        )}

        <div className="mt-auto pt-5 border-t border-slate-100">
           <div className="flex items-end justify-between mb-5">
              <div className="flex flex-col gap-0.5">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Package</span>
                 <div className="flex items-center gap-1">
                    <span className="text-2xl font-black text-[#111827]">₹{basePrice?.toLocaleString() || "2,500"}</span>
                    <span className="text-[10px] font-bold text-slate-400 mb-1">/event</span>
                 </div>
              </div>
              <div className="text-right">
                 <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100 text-[10px] font-black uppercase py-0.5 mb-1">Available</Badge>
              </div>
           </div>

           <Link href={`/marketplace/vendor/${vendor.id}`}>
             <Button
               className="w-full bg-[#111827] hover:bg-blue-600 text-white rounded-xl h-11 text-xs font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 group/btn"
             >
               View Profile
               <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
             </Button>
           </Link>
        </div>
      </div>
    </div>
  );
});

