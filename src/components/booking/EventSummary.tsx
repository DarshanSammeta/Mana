"use client";

import { useCheckoutStore } from "@/store/checkoutStore";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Users, MapPin, Package } from "lucide-react";
import { memo } from "react";

const StatusBadge = ({ status }: { status: string }) => {
  const configs = {
    DRAFT: { label: "Draft Booking", className: "bg-slate-100 text-slate-500" },
    IN_PROGRESS: { label: "Booking in Progress", className: "bg-amber-50 text-amber-600 border-amber-100" },
    READY_FOR_PAYMENT: { label: "Ready for Payment", className: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    CONFIRMED: { label: "Booking Confirmed", className: "bg-[#6D28D9] text-white border-none" },
  };

  const config = configs[status as keyof typeof configs] || configs.DRAFT;

  return (
    <Badge variant="outline" className={cn("px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest", config.className)}>
      {config.label}
    </Badge>
  );
};

export const EventSummary = memo(function EventSummary() {
  const {
    serviceImage,
    serviceName,
    vendorName,
    selection,
    eventDetails,
    pricing,
    status
  } = useCheckoutStore();

  const placeholderImg = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1000";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Card className="p-6 border-none shadow-sm rounded-[16px] bg-white">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Left: Image & Title */}
          <div className="flex items-center gap-6 w-full lg:w-auto shrink-0">
            <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-slate-100 shrink-0">
              <Image
                src={serviceImage || placeholderImg}
                alt={serviceName || "Service"}
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Your Event</p>
              <h1 className="text-xl font-black text-slate-900 truncate uppercase italic leading-tight">
                {serviceName || "Will be confirmed during booking"}
              </h1>
              <p className="text-xs font-bold text-[#6D28D9] uppercase tracking-tight truncate">
                {vendorName || "Mana Verified Vendor"}
              </p>
            </div>
          </div>

          {/* Center: Dynamic Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1 w-full border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Package className="h-3 w-3" /> Package
              </p>
              <p className="text-[11px] font-bold text-slate-900 truncate uppercase">
                {selection.packageName || "Selecting..."}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> Date
              </p>
              <p className="text-[11px] font-bold text-slate-900 uppercase">
                {eventDetails.date || "Will be selected"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Users className="h-3 w-3" /> Guests
              </p>
              <p className="text-[11px] font-bold text-slate-900 uppercase">
                {eventDetails.guestCount} People
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> Location
              </p>
              <p className="text-[11px] font-bold text-slate-900 truncate uppercase">
                {eventDetails.venue || "To be confirmed"}
              </p>
            </div>
          </div>

          {/* Right: Pricing & Status */}
          <div className="flex flex-col items-center lg:items-end gap-3 w-full lg:w-auto shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
            <div className="text-center lg:text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Total</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={pricing.total}
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-2xl font-black text-slate-900 leading-none"
                >
                  {formatCurrency(pricing.total)}
                </motion.p>
              </AnimatePresence>
            </div>
            <StatusBadge status={status} />
          </div>
        </div>
      </Card>
    </div>
  );
});
