"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Zap,
  ShieldCheck,
  MapPin,
  Package,
  Users
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useAddToCart } from "@/hooks/use-commerce";
import { useCheckoutStore } from "@/store/checkoutStore";
import { Input } from "@/components/ui/input";

interface Package {
  id: string;
  name: string;
  price: number | string;
  description?: string;
}

interface ServicePurchaseBoxProps {
  serviceId: string;
  vendorId: string;
  vendorName: string;
  serviceName?: string;
  serviceImage?: string;
  city: string;
  packages: Package[];
  basePrice: number;
  selectedPackageId: string;
  onPackageSelect: (id: string) => void;
}

export function ServicePurchaseBox({
  serviceId,
  vendorId,
  vendorName,
  serviceName,
  serviceImage,
  city,
  packages,
  basePrice,
  selectedPackageId,
  onPackageSelect,
}: ServicePurchaseBoxProps) {
  const router = useRouter();
  const [guestCount, setGuestCount] = useState(100);
  const { mutate: executeAddToCartMutation, isPending: isAdding } = useAddToCart();

  const activePackage = packages.find(p => p.id === selectedPackageId);
  const currentPrice = activePackage ? Number(activePackage.price) : basePrice;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[ServicePurchaseBox] handleAddToCart triggered");
    executeAddToCartMutation({
      type: "PACKAGE",
      targetId: selectedPackageId || serviceId,
      vendorId: vendorId,
      packageId: selectedPackageId || undefined,
      quantity: 1,
      guestCount: guestCount,
      metadata: {
        title: activePackage?.name || "Service",
        vendorName: vendorName,
        price: currentPrice
      }
    });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[ServicePurchaseBox] handleBuyNow triggered");
    const store = useCheckoutStore.getState();
    store.resetCheckout();
    store.setVendorInfo({
      vendorId,
      vendorName,
      serviceId,
      packageId: selectedPackageId,
      packageName: activePackage?.name,
      basePrice: currentPrice,
      serviceName,
      serviceImage
    });
    store.setEventDetails({ guestCount });
    store.setIsStarted(true);
    router.push('/customer/booking/event-type');
  };

  return (
    <Card className="p-6 sticky top-32 border border-slate-200 shadow-xl rounded-[1.5rem] bg-white ring-offset-background focus-within:ring-2 focus-within:ring-primary/20">
      <div className="space-y-6">
        {/* Pricing */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
             <span className="text-3xl font-black text-slate-900">{formatCurrency(currentPrice)}</span>
             <span className="text-sm font-bold text-slate-400">/ event</span>
          </div>
          <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 fill-emerald-600" />
            FREE Cancellation (within 24 hrs)
          </p>
        </div>

        {/* Location & Delivery */}
        <div className="py-4 border-y border-slate-100 space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Delivery to {city}</p>
              <p className="text-xs text-slate-500 font-medium">Verified for your event location</p>
            </div>
          </div>
          <div className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl text-xs font-bold border border-emerald-100">
            Available for booking in 2026
          </div>
        </div>

        {/* Package Selection */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Select Package</label>
          <div className="space-y-2" role="radiogroup" aria-label="Package selector">
            {packages.map((pkg) => (
              <button
                key={pkg.id}
                onClick={() => onPackageSelect(pkg.id)}
                role="radio"
                aria-checked={selectedPackageId === pkg.id}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-primary",
                  selectedPackageId === pkg.id ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors",
                    selectedPackageId === pkg.id ? "border-primary" : "border-slate-300"
                  )}>
                    {selectedPackageId === pkg.id && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight">{pkg.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 line-clamp-1">{pkg.description || "View inclusions below"}</p>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-900">{formatCurrency(Number(pkg.price))}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Guest Count */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Expected Guests</label>
          <div className="relative">
            <Input
              type="number"
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Users className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Button
            type="button"
            onClick={handleBuyNow}
            className="w-full h-14 rounded-2xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            Buy Now
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full h-14 rounded-2xl border-2 font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 transition-all active:scale-95"
            onClick={handleAddToCart}
            disabled={isAdding}
          >
            {isAdding ? "Adding..." : "Add to Cart"}
          </Button>
        </div>

        {/* Trust Markers */}
        <div className="pt-4 space-y-3">
          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            Secure Transaction via Mana Pay
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
            <Package className="h-4 w-4 text-slate-400" />
            Sold by {vendorName}
          </div>
        </div>
      </div>
    </Card>
  );
}
