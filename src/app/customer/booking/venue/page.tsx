"use client";

import { useCheckoutStore } from "@/store/checkoutStore";
import { useRouter } from "next/navigation";
import { MapPin, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { EventSummary } from "@/components/booking/EventSummary";
import { BookingProgress } from "@/components/booking/BookingProgress";
import { OrderSummary } from "@/components/booking/OrderSummary";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LocationPicker } from "@/components/maps/LocationPicker";

export default function VenuePage() {
  const router = useRouter();
  const { eventDetails, setEventDetails } = useCheckoutStore();
  const [isMapOpen, setIsMapOpen] = useState(false);

  const handleNext = () => {
    if (!eventDetails.venue) return;
    router.push("/customer/booking/menu");
  };

  return (
    <div className="bg-white min-h-screen">
      <EventSummary />
      <BookingProgress currentStep={3} />

      <main className="max-w-7xl mx-auto px-4 pt-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Form Area */}
          <div className="lg:col-span-8 space-y-10">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Event Venue</h1>
              <p className="text-slate-500 font-medium">Where is the celebration happening?</p>
            </div>

            <Card className="p-8 border-none shadow-sm rounded-[24px] bg-white space-y-8">
              <div className="space-y-3">
                <Label htmlFor="venue-address" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Venue Address</Label>
                <div className="relative">
                  <Input
                    id="venue-address"
                    placeholder="Enter full address or landmark"
                    value={eventDetails.venue || ""}
                    onChange={e => setEventDetails({ venue: e.target.value })}
                    className="h-16 rounded-xl border-slate-200 px-6 pr-16 font-bold text-lg focus:border-[#6D28D9] transition-all"
                  />
                  <button
                    onClick={() => setIsMapOpen(true)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-[#6D28D9] hover:bg-[#6D28D9]/5 rounded-xl transition-colors"
                  >
                    <MapPin className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 border-dashed text-center">
                <p className="text-sm text-slate-400 font-medium">Can&apos;t find your address? Use the map picker for precise location.</p>
                <Button
                  variant="outline"
                  className="mt-4 rounded-xl font-bold border-slate-200"
                  onClick={() => setIsMapOpen(true)}
                >
                  <MapPin className="mr-2 h-4 w-4" /> Open Map Picker
                </Button>
              </div>
            </Card>

            <div className="pt-10 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => router.push("/customer/booking/guests")}
                className="text-slate-400 font-black uppercase tracking-widest hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                className="h-16 px-12 rounded-2xl font-black text-lg bg-[#6D28D9] hover:bg-[#6D28D9]/90 shadow-xl shadow-[#6D28D9]/20 group"
                onClick={handleNext}
                disabled={!eventDetails.venue}
              >
                Continue to Menu
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

      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-[24px] border-none">
          <div className="p-8 border-b bg-white">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Select Venue Location</h3>
          </div>
          <div className="h-[500px]">
            <LocationPicker onLocationSelect={(loc) => { setEventDetails({ venue: loc.address }); setIsMapOpen(false); }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
