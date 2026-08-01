"use client";

import { useCheckoutStore } from "@/store/checkoutStore";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventSummary } from "@/components/booking/EventSummary";
import { BookingProgress } from "@/components/booking/BookingProgress";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { OrderSummary } from "@/components/booking/OrderSummary";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function BookingReviewPage() {
  const router = useRouter();
  const { eventDetails, selection, setStatus } = useCheckoutStore();

  const handleContinue = () => {
    setStatus('READY_FOR_PAYMENT');
    router.push("/customer/checkout");
  };

  return (
    <div className="bg-white min-h-screen">
      <EventSummary />
      <BookingProgress currentStep={5} />

      <main className="max-w-7xl mx-auto px-4 pt-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Review your Booking</h1>
              <p className="text-slate-500 font-medium">Please verify all details before proceeding to payment.</p>
            </div>

            <BookingSummary />

            {/* Extra requirements summary */}
            {(eventDetails.instructions || selection.selectedAddonIds.length > 0) && (
              <Card className="p-8 border-none shadow-sm rounded-[24px] bg-white space-y-6">
                <div className="flex items-center gap-3 border-b pb-6">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <ClipboardList className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900 uppercase italic">Customizations & Notes</h2>
                </div>

                {selection.selectedAddonIds.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Add-ons</p>
                    <div className="flex flex-wrap gap-2">
                      {selection.selectedAddonIds.map((id) => (
                        <Badge key={id} variant="secondary" className="bg-blue-50 text-blue-700 border-none px-3 py-1 font-bold text-[10px] uppercase">
                          Add-on ID: {id.slice(-4)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {eventDetails.instructions && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Special Instructions</p>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 italic text-sm text-slate-600">
                      &quot;{eventDetails.instructions}&quot;
                    </div>
                  </div>
                )}
              </Card>
            )}

            <div className="pt-10 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => router.push("/customer/booking/menu")}
                className="text-slate-400 font-black uppercase tracking-widest hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                className="h-16 px-12 rounded-2xl font-black text-lg bg-[#6D28D9] hover:bg-[#6D28D9]/90 shadow-xl shadow-[#6D28D9]/20 group"
                onClick={handleContinue}
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-32">
            <OrderSummary />
          </div>
        </div>
      </main>
    </div>
  );
}

