"use client";

import { useCheckoutStore } from "@/store/checkoutStore";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ShieldCheck, Building, RefreshCw } from "lucide-react";
import { memo } from "react";

interface OrderSummaryProps {
  showTrustBadges?: boolean;
}

export const OrderSummary = memo(function OrderSummary({ showTrustBadges = false }: OrderSummaryProps) {
  const { pricing, selection, eventDetails, isPricingLoading } = useCheckoutStore();

  const hasItems = selection.packageId || useCheckoutStore.getState().items.length > 0;

  if (!hasItems && pricing.total === 0) return null;

  return (
    <Card className="border-none shadow-xl rounded-[20px] overflow-hidden bg-white p-8">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
        <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">
          Order Summary
        </h3>
        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 font-bold text-[10px] uppercase border-none px-3 py-1">
          Price Locked
        </Badge>
      </div>

      <div className="space-y-4 mb-6 relative">
        {isPricingLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl">
            <RefreshCw className="h-5 w-5 animate-spin text-[#6D28D9]" />
          </div>
        )}

        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500 font-medium">
            {selection.packageName || "Package"}
          </span>
          <span className="text-slate-900 font-bold">{formatCurrency(pricing.subtotal)}</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500 font-medium">Guest Count</span>
          <span className="text-slate-900 font-bold">{eventDetails.guestCount} People</span>
        </div>

        {pricing.totalAddonAmount ? pricing.totalAddonAmount > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium">Extra Add-ons</span>
            <span className="text-slate-900 font-bold">{formatCurrency(pricing.totalAddonAmount)}</span>
          </div>
        ) : null}

        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500 font-medium">GST (18%)</span>
          <span className="text-slate-900 font-bold">{formatCurrency(pricing.totalGst || (pricing.subtotal * 0.18))}</span>
        </div>

        {(pricing.totalCouponDiscount ?? 0) > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-emerald-600 font-medium">Coupon Savings</span>
            <span className="text-emerald-600 font-bold">-{formatCurrency(pricing.totalCouponDiscount ?? 0)}</span>
          </div>
        )}
      </div>

      <div className="pt-6 border-t-2 border-dashed border-slate-100 space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-sm font-bold uppercase tracking-tight text-slate-900">Grand Total</span>
          <span className="text-3xl font-black text-[#6D28D9]">{formatCurrency(pricing.total)}</span>
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Inclusive of all taxes</p>
      </div>

      {showTrustBadges && (
        <div className="mt-6 pt-6 border-t border-slate-50 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">SSL Secure Payment</p>
              <p className="text-[9px] text-slate-400 font-medium">256-bit encryption active</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Building className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">Verified Vendors</p>
              <p className="text-[9px] text-slate-400 font-medium">100% genuine services</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
});
