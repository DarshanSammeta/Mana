"use client";

import { useCheckoutStore } from "@/store/checkoutStore";
import { Card } from "@/components/ui/card";
import { Calendar, Users, MapPin, Store, Package, Sparkles } from "lucide-react";
import { memo } from "react";
import Link from "next/link";

export const BookingSummary = memo(function BookingSummary() {
  const { selection, eventDetails, vendorName, serviceName } = useCheckoutStore();

  return (
    <Card className="p-8 border-none shadow-sm rounded-[24px] bg-white relative overflow-hidden">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase italic">Booking Summary</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Review your event details</p>
          </div>
        </div>
        <Link
          href="/customer/booking/review"
          className="text-xs font-bold text-primary hover:underline uppercase tracking-tight"
        >
          Edit Booking
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        {/* Vendor & Service */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-50 border flex items-center justify-center shrink-0">
              <Store className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vendor</p>
              <p className="text-sm font-bold text-slate-900">{vendorName || "Not selected"}</p>
              <p className="text-xs text-slate-500">{serviceName}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-50 border flex items-center justify-center shrink-0">
              <Package className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Package</p>
              <p className="text-sm font-bold text-slate-900">{selection.packageName || "Not selected"}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-50 border flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Event Type</p>
              <p className="text-sm font-bold text-slate-900">{selection.eventTypeName || "Not set"}</p>
            </div>
          </div>
        </div>

        {/* Schedule & Venue */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-50 border flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date & Time</p>
              <p className="text-sm font-bold text-slate-900">{eventDetails.date || "TBD"} at {eventDetails.time || "12:00"}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-50 border flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Guests</p>
              <p className="text-sm font-bold text-slate-900">{eventDetails.guestCount} People</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-50 border flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Venue</p>
              <p className="text-sm font-bold text-slate-900 line-clamp-2">{eventDetails.venue || "To be confirmed"}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
});
