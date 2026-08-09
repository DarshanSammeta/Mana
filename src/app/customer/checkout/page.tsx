"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCheckoutStore } from "@/store/checkoutStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Building,
  CreditCard as CardIcon,
  Mail,
  User,
  Phone,
  Ticket
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { customerService } from "@/services/client";
import { RAZORPAY_CONFIG } from "@/config/razorpay";
import { PaymentSelector } from "@/components/booking/PaymentSelector";
import { EventSummary } from "@/components/booking/EventSummary";
import { OrderSummary } from "@/components/booking/OrderSummary";
import { BookingSummary } from "@/components/booking/BookingSummary";

function CheckoutContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();

  const {
    items,
    eventDetails,
    pricing,
    selection,
    paymentMethod,
    isAgreed,
    setPaymentMethod,
    setIsAgreed,
    resetCheckout,
    fetchServerPricing
  } = useCheckoutStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  // Diagnostic logging for checkout state
  useEffect(() => {
    console.log("[Checkout] State Update:", {
        isSubmitting,
        isAgreed,
        paymentMethod,
        itemCount: items.length,
        hasGuestCount: !!eventDetails.guestCount,
        hasDate: !!eventDetails.date,
        idempotencyKey: selection.idempotencyKey
    });
  }, [isSubmitting, isAgreed, paymentMethod, items, eventDetails, selection.idempotencyKey]);

  // Sync pricing on mount if session exists
  useEffect(() => {
    const sessionItems = useCheckoutStore.getState().items;
    const pkgId = useCheckoutStore.getState().selection.packageId;
    if (sessionItems.length > 0 || pkgId) {
        fetchServerPricing();
    }
  }, [fetchServerPricing]);

  const handlePayment = async () => {
    if (isSubmitting || !isAgreed || !paymentMethod) return;
    setIsSubmitting(true);

    try {
      const res = await customerService.checkout({
        items: items.map(i => ({
            serviceId: i.serviceId,
            packageId: i.packageId,
            selectedAddonIds: i.selectedAddonIds
        })),
        eventDetails: { ...eventDetails },
        couponCode,
        idempotencyKey: selection.idempotencyKey
      });

      const orderRes = await customerService.createRazorpayOrder({
        amount: res.amounts.advance,
        bookingId: res.id,
        paymentType: "ADVANCE"
      });

      const options = {
        key: RAZORPAY_CONFIG.keyId,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: "Mana Events",
        description: `Order ID: ${res.orderNumber}`,
        order_id: orderRes.id,
        handler: async (response: any) => {
          try {
            await customerService.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: res.id,
            });
            useCheckoutStore.getState().setStatus('CONFIRMED');
            resetCheckout();
            router.push(`/customer/booking/success?orderId=${res.id}`);
          } catch {
            router.push(`/customer/orders/failed?orderId=${res.id}&reason=verification_failed`);
          }
        },
        prefill: { name: user?.fullName, email: user?.email, contact: user?.mobileNumber },
        theme: { color: "#6D28D9" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      setIsSubmitting(false);
      toast({ variant: "destructive", title: "Order Failed", description: error.response?.data?.message || "Failed." });
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <EventSummary />

      <main className="max-w-7xl mx-auto px-4 py-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* Left Column: Review & Payment */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Secure Checkout</h1>
              <p className="text-slate-500 font-medium">Review your booking and select a payment method to confirm.</p>
            </div>

            <BookingSummary />

            {/* Customer Details */}
            <Card className="p-8 border-none shadow-sm rounded-[24px] bg-white space-y-6">
              <div className="flex items-center gap-3 border-b pb-6">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-black text-slate-900 uppercase italic">Customer Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <Input disabled value={user?.fullName || ""} className="pl-10 h-12 rounded-xl bg-slate-50/50 border-slate-100 font-bold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <Input disabled value={user?.email || ""} className="pl-10 h-12 rounded-xl bg-slate-50/50 border-slate-100 font-bold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <Input disabled value={user?.mobileNumber || ""} className="pl-10 h-12 rounded-xl bg-slate-50/50 border-slate-100 font-bold" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Coupon Section */}
            <Card className="p-8 border-none shadow-sm rounded-[24px] bg-white space-y-6">
               <div className="flex items-center gap-3 border-b pb-6">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Ticket className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900 uppercase italic">Coupons & Offers</h2>
               </div>
               <div className="flex gap-4">
                  <Input
                    placeholder="Enter Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="h-14 rounded-xl border-slate-200 uppercase font-black tracking-widest"
                  />
                  <Button variant="premium" className="h-14 px-8 rounded-xl font-bold">Apply</Button>
               </div>
            </Card>

            {/* Payment Method */}
            <Card className="p-8 border-none shadow-sm rounded-[24px] bg-white space-y-6">
              <div className="flex items-center gap-3 border-b pb-6">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CardIcon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-black text-slate-900 uppercase italic">Payment Method</h2>
              </div>
              <PaymentSelector selectedMethod={paymentMethod || undefined} onSelect={setPaymentMethod} />
            </Card>

            {/* Terms & Conditions */}
            <Card className="p-8 border-none shadow-sm bg-slate-900 rounded-[24px] text-white space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Secure Payment Guarantee</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                By clicking &quot;Pay Now&quot;, you agree to Mana Events Terms of Service and understanding that payments are processed via encrypted gateways.
              </p>
              <label className="flex items-center gap-3 cursor-pointer group pt-4 border-t border-white/10">
                <input
                  type="checkbox"
                  checked={isAgreed}
                  onChange={e => setIsAgreed(e.target.checked)}
                  className="h-5 w-5 rounded-lg border-white/20 bg-white/5 text-primary focus:ring-primary"
                />
                <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                  I agree to the Terms & Conditions and Cancellation Policy.
                </span>
              </label>
            </Card>
          </div>

          {/* Right Column: Sticky Summary */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-32">
            <OrderSummary showTrustBadges />

            <Button
              className="w-full h-20 rounded-[20px] font-black text-xl bg-[#6D28D9] hover:bg-[#5B21B6] shadow-2xl shadow-primary/30 transition-all active:scale-95 group"
              disabled={isSubmitting || !isAgreed || !paymentMethod}
              onClick={handlePayment}
            >
              {isSubmitting ? (
                <RefreshCw className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  Pay {formatCurrency(pricing.advanceAmount || pricing.total * 0.3)} Now
                  <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            <div className="px-6 space-y-4">
              <div className="flex items-center gap-3 text-slate-400">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">256-Bit SSL Secured</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <CardIcon className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">PCI-DSS Compliant Payments</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <Building className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Mana Verified Partner</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-white font-black uppercase tracking-[0.2em] text-[#6D28D9] animate-pulse">Initializing Secure Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
