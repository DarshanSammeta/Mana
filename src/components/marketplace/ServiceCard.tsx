"use client";

import { Star, ShoppingCart, Zap, BadgeCheck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { cn, formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { memo, useState } from "react";
import { useAddToCart } from "@/hooks/use-commerce";
import { IMAGES } from "@/constants";

interface ServiceCardProps {
  service: {
    id: string;
    slug: string;
    title: string;
    category: string;
    startingPrice: number;
    discount?: number;
    images?: string[];
    rating: number;
    reviewCount: number;
    vendor: {
      id: string;
      businessName: string;
      city: string;
      isVerified: boolean;
    };
    badges: string[];
  };
  index: number;
  priority?: boolean;
}

const BLUR_DATA_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMzAwIDIwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YxZjVmOSIvPjwvc3ZnPg==";

export const ServiceCard = memo(function ServiceCard({ service, index, priority = false }: ServiceCardProps) {
  const { mutate: addToCart } = useAddToCart();
  const [isHovered, setIsHovered] = useState(false);
  const [imgSrc, setImgSrc] = useState(service.images?.[0] || IMAGES.DEFAULT_EVENT);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      type: "SERVICE",
      targetId: service.id,
      vendorId: service.vendor.id,
      quantity: 1,
      metadata: {
        title: service.title,
        price: service.startingPrice,
        image: imgSrc
      }
    });
  };

  // Progressive Enhancement Logic
  const hasDiscount = !!(service as any).originalPrice || !!service.discount;
  const originalPrice = (service as any).originalPrice || (service.discount ? service.startingPrice / (1 - service.discount / 100) : null);
  const discountPercentage = service.discount || ((service as any).discountPercentage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-white border border-slate-100 rounded-xl overflow-hidden flex flex-col hover:shadow-[0_15px_35px_rgba(109,40,217,0.15)] transition-all duration-300 h-full focus-within:ring-2 focus-within:ring-[#6D28D9] focus-within:ring-offset-2"
    >
      {/* Entire card is clickable via this absolute Link */}
      <Link
        href={`/marketplace/service/${service.id}`}
        className="absolute inset-0 z-0"
        aria-label={`View details for ${service.title}`}
      />

      <div className="relative z-10 flex flex-col h-full pointer-events-none">
        {/* Image Section - 16:9 Aspect Ratio */}
        <div className="relative aspect-video overflow-hidden bg-slate-50">
          <motion.div
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.4 }}
            className="relative w-full h-full"
          >
            <Image
              src={imgSrc}
              alt={service.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              priority={priority}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              onError={() => setImgSrc(IMAGES.DEFAULT_EVENT)}
            />
          </motion.div>

          {/* Dynamic Badges Overlay */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 z-10 max-w-[80%]">
            {service.badges?.map((badge) => (
              <Badge
                key={badge}
                className={cn(
                  "px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border-none shadow-sm",
                  badge === "Bestseller" ? "bg-[#B12704] text-white" :
                  badge === "Premium" ? "bg-[#6D28D9] text-white" :
                  badge === "New Arrival" ? "bg-emerald-600 text-white" :
                  badge === "Trending" ? "bg-orange-500 text-white" :
                  "bg-slate-700 text-white"
                )}
              >
                {badge}
              </Badge>
            ))}
            {service.vendor.isVerified && (
               <Badge className="bg-blue-600 text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border-none shadow-sm flex items-center gap-1">
                 <BadgeCheck className="h-2.5 w-2.5" />
                 Verified
               </Badge>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3 flex flex-col flex-1">
          {/* Vendor Name */}
          <div className="mb-1">
            <span className="text-[10px] font-bold text-[#6D28D9] uppercase tracking-wider">
              {service.vendor.businessName}
            </span>
          </div>

          {/* Service Title - 2 lines max */}
          <h3 className="text-sm font-bold text-[#0F1111] line-clamp-2 leading-tight mb-2 group-hover:text-[#6D28D9] transition-colors">
            {service.title}
          </h3>

          {/* Rating + Review Count */}
          <div className="flex items-center gap-1.5 mb-2">
            {service.reviewCount > 0 ? (
              <>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3 w-3",
                        i < Math.floor(service.rating) ? "fill-[#FFA41C] text-[#FFA41C]" : "text-slate-200"
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-[#6D28D9]">{service.reviewCount}</span>
              </>
            ) : (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter bg-slate-50 px-1.5 py-0.5 rounded">
                New Service
              </span>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium mb-3">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{service.vendor.city}</span>
          </div>

          {/* Pricing Section - Progressive Enhancement */}
          <div className="mt-auto space-y-1">
            {hasDiscount ? (
              <div className="flex flex-col">
                 <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-[#0F1111]">{formatCurrency(service.startingPrice)}</span>
                    <span className="text-[10px] font-bold text-[#B12704]">{discountPercentage}% OFF</span>
                 </div>
                 {originalPrice && (
                    <span className="text-xs text-slate-500 line-through -mt-1">{formatCurrency(originalPrice)}</span>
                 )}
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Starting From</span>
                <span className="text-lg font-black text-[#0F1111]">{formatCurrency(service.startingPrice)}</span>
              </div>
            )}

            {/* Availability Placeholder */}
            <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
              <Zap className="h-3 w-3 fill-emerald-600" />
              Available Today
            </div>
          </div>
        </div>

        {/* Footer Action - Single Primary Button */}
        <div className="px-3 pb-3 pointer-events-auto">
          <Button
            onClick={handleAddToCart}
            className="w-full bg-[#6D28D9] hover:bg-[#5B21B6] active:bg-[#4C1D95] text-white rounded-[12px] h-[44px] text-sm font-semibold shadow-sm border-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(109,40,217,0.3)] active:scale-[0.98] disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF] disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ShoppingCart className="h-[18px] w-[18px]" />
            Add to Cart
          </Button>
        </div>
      </div>
    </motion.div>
  );
});
