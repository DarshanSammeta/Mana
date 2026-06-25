"use client";

import { motion } from "framer-motion";
import { Star, MapPin, ShieldCheck, Heart, Info, Check, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

import { useCommerceStore } from "@/store/commerceStore";
import { useAuthStore } from "@/store/authStore";
import { useAddToCart, useToggleWishlist } from "@/hooks/useCommerce";

interface VendorCardProps {
  vendor: any;
  index: number;
  viewMode?: "grid" | "list";
  onQuickView?: (vendor: any) => void;
  priority?: boolean;
}

export function VendorCard({ vendor, index, viewMode = "grid", onQuickView, priority = false }: VendorCardProps) {
  const { wishlist, addToCart: addToStore, toggleWishlist: toggleStore } = useCommerceStore();
  const { user } = useAuthStore();
  const { mutate: addToCartApi } = useAddToCart();
  const { mutate: toggleWishlistApi } = useToggleWishlist();

  const isWishlisted = wishlist.some(i => i.targetId === vendor.id);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (user) {
      toggleWishlistApi({ type: "SERVICE", targetId: vendor.id });
    } else {
      toggleStore({ type: "SERVICE", targetId: vendor.id });
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (user) {
      addToCartApi({ type: "SERVICE", targetId: vendor.id, quantity: 1 });
    } else {
      addToStore({
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
              src={vendor.coverImage || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800"}
              alt={vendor.businessName}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, 300px"
              priority={priority}
            />
          </Link>
          <button
            onClick={handleToggleWishlist}
            className={cn(
              "absolute top-4 right-4 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm border border-border flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-sm",
              isWishlisted ? "text-destructive" : "text-slate-400 hover:text-destructive"
            )}
          >
            <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
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
                  <span className="text-3xl font-black text-foreground">₹{vendor.basePrice}</span>
               </div>
               <p className="text-xs text-muted-foreground mt-2 font-medium">Includes basic setup & professional consultation</p>
            </div>

               <div className="flex flex-col gap-3 mt-8">
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onQuickView?.(vendor);
                    }}
                    variant="outline"
                    className="w-full border-border bg-white hover:bg-hover text-card-foreground rounded-lg h-11 font-bold transition-all shadow-sm"
                  >
                    Quick Preview
                  </Button>
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
    <div className="bg-white border border-border rounded-xl overflow-hidden flex flex-col hover:shadow-lg transition-all group h-full">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
        <Link href={`/marketplace/vendor/${vendor.id}`}>
          <Image
            src={vendor.coverImage || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800"}
            alt={vendor.businessName}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 300px"
            priority={priority}
          />
        </Link>
        <div className="absolute top-2 left-2">
           {vendor.verificationStatus === "APPROVED" && (
             <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm border border-primary/10">
                <ShieldCheck className="h-4 w-4 text-primary" />
             </div>
           )}
        </div>
        <button
          onClick={handleToggleWishlist}
          className={cn(
            "absolute top-2 right-2 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm border border-border flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-sm",
            isWishlisted ? "text-destructive" : "text-slate-400 hover:text-destructive"
          )}
        >
          <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
        </button>
      </div>

        <div className="flex-1 p-3 md:p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-2 mb-1">
           <Link href={`/marketplace/vendor/${vendor.id}`} className="flex-1">
             <h3 className="text-sm md:text-base font-bold text-foreground hover:text-primary transition-colors line-clamp-1 leading-tight">
               {vendor.businessName}
             </h3>
           </Link>
           <div className="flex items-center gap-1 bg-muted px-1 py-0.5 md:px-1.5 rounded border border-border">
              <Star className="h-2.5 w-2.5 md:h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
              <span className="text-[9px] md:text-[11px] font-bold text-foreground">{vendor.rating || "4.8"}</span>
           </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground mb-3 md:mb-4 font-medium">
           <MapPin className="h-2.5 w-2.5 md:h-3 w-3" />
           <span className="truncate">{vendor.city || "Location"}</span>
        </div>

        <div className="mt-auto pt-3 md:pt-4 border-t border-border">
           <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex flex-col">
                 <span className="text-[8px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Starts from</span>
                 <span className="text-base md:text-xl font-black text-foreground">₹{vendor.basePrice || vendor.minPrice || "2,500"}</span>
              </div>
              <div className="text-right hidden sm:block">
                 <span className="text-[10px] font-bold text-success uppercase tracking-wider block">Available</span>
                 <span className="text-[11px] font-medium text-muted-foreground">Next week</span>
              </div>
           </div>

           <Link href={`/marketplace/vendor/${vendor.id}`}>
             <Button
               className="w-full bg-primary hover:bg-blue-600 text-white border border-primary rounded-lg h-8 md:h-10 text-[11px] md:text-sm font-bold shadow-sm transition-all active:scale-95"
             >
               View Details
             </Button>
           </Link>
        </div>
      </div>
    </div>
  );
}

