"use client";

import { useCheckoutStore } from "@/store/checkoutStore";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EventSummary } from "@/components/booking/EventSummary";
import { BookingProgress } from "@/components/booking/BookingProgress";
import { useEventTypes } from "@/hooks/useBookingData";
import { Skeleton } from "@/components/ui/skeleton";

export default function EventTypePage() {
  const router = useRouter();
  const { selection, setEventType } = useCheckoutStore();
  const { data: eventTypes, isLoading } = useEventTypes();

  const handleNext = () => {
    if (!selection.eventTypeId) return;
    router.push("/customer/booking/guests");
  };

  return (
    <div className="bg-white min-h-screen">
      <EventSummary />
      <BookingProgress currentStep={1} />

      <main className="max-w-4xl mx-auto px-4 pt-10 pb-20">
        <div className="space-y-10">
          <div className="text-center">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">What are you celebrating?</h1>
            <p className="text-slate-500 font-medium mt-2">Select your event type to help us customize your experience.</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-[24px]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {eventTypes?.map((et: any) => (
                <button
                  key={et.id}
                  onClick={() => setEventType(et.id, et.name)}
                  className={cn(
                    "p-8 rounded-[24px] border-2 transition-all text-left group bg-white relative overflow-hidden",
                    selection.eventTypeId === et.id
                      ? "border-[#6D28D9] bg-[#6D28D9]/5 ring-4 ring-[#6D28D9]/5"
                      : "border-slate-100 hover:border-[#6D28D9]/30"
                  )}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Sparkles className="h-20 w-20 text-[#6D28D9]" />
                  </div>
                  <Sparkles className={cn(
                    "h-8 w-8 mb-4 group-hover:scale-110 transition-transform",
                    selection.eventTypeId === et.id ? "text-[#6D28D9]" : "text-slate-300"
                  )} />
                  <span className="font-black text-sm uppercase tracking-widest block text-slate-900">{et.name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="pt-10 flex justify-center">
            <Button
              className="h-16 px-12 rounded-2xl font-black text-lg bg-[#6D28D9] hover:bg-[#6D28D9]/90 shadow-xl shadow-[#6D28D9]/20 transition-all active:scale-95 group"
              onClick={handleNext}
              disabled={!selection.eventTypeId}
            >
              Continue to Guests
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
