"use client";

import { useCheckoutStore } from "@/store/checkoutStore";
import { useRouter } from "next/navigation";
import { Calendar, Users, Clock, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { EventSummary } from "@/components/booking/EventSummary";
import { BookingProgress } from "@/components/booking/BookingProgress";
import { OrderSummary } from "@/components/booking/OrderSummary";

export default function GuestsPage() {
  const router = useRouter();
  const { eventDetails, setEventDetails } = useCheckoutStore();

  const handleNext = () => {
    if (!eventDetails.date) return;
    router.push("/customer/booking/venue");
  };

  return (
    <div className="bg-white min-h-screen">
      <EventSummary />
      <BookingProgress currentStep={2} />

      <main className="max-w-7xl mx-auto px-4 pt-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Form Area */}
          <div className="lg:col-span-8 space-y-10">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Guests & Schedule</h1>
              <p className="text-slate-500 font-medium">When is your event and how many people are coming?</p>
            </div>

            <Card className="p-8 border-none shadow-sm rounded-[24px] bg-white space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="event-date" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Event Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="event-date"
                      type="date"
                      value={eventDetails.date || ""}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setEventDetails({ date: e.target.value })}
                      className="h-14 rounded-xl border-slate-200 pl-12 font-bold text-base px-6 focus:border-[#6D28D9] transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="event-time" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Preferred Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="event-time"
                      type="time"
                      value={eventDetails.time || "12:00"}
                      onChange={e => setEventDetails({ time: e.target.value })}
                      className="h-14 rounded-xl border-slate-200 pl-12 font-bold text-base px-6 focus:border-[#6D28D9] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Label htmlFor="guest-count" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Estimated Guest Count</Label>
                <div className="relative">
                  <Users className="absolute left-6 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400" />
                  <Input
                    id="guest-count"
                    type="number"
                    value={eventDetails.guestCount}
                    onChange={e => setEventDetails({ guestCount: parseInt(e.target.value) || 0 })}
                    className="h-20 rounded-2xl border-slate-200 pl-20 font-black text-4xl focus:border-[#6D28D9] text-[#6D28D9] transition-all"
                  />
                </div>
                <p className="text-xs text-slate-400 font-medium italic ml-2">This helps us calculate per-head scaling and resource requirements.</p>
              </div>
            </Card>

            <div className="pt-10 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => router.push("/customer/booking/event-type")}
                className="text-slate-400 font-black uppercase tracking-widest hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                className="h-16 px-12 rounded-2xl font-black text-lg bg-[#6D28D9] hover:bg-[#6D28D9]/90 shadow-xl shadow-[#6D28D9]/20 group"
                onClick={handleNext}
                disabled={!eventDetails.date}
              >
                Continue to Venue
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 lg:sticky lg:top-32">
            <OrderSummary />
          </div>
        </div>
      </main>
    </div>
  );
}
