"use client";

import { useCheckoutStore } from "@/store/checkoutStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePackageAddons } from "@/hooks/useBookingData";
import { ArrowRight, ArrowLeft, CheckCircle2, Utensils, Plus, Zap, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency, cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EventSummary } from "@/components/booking/EventSummary";
import { BookingProgress } from "@/components/booking/BookingProgress";
import { OrderSummary } from "@/components/booking/OrderSummary";

export default function MenuPage() {
  const router = useRouter();
  const {
    selection,
    items,
    toggleAddon,
    fetchServerPricing
  } = useCheckoutStore();

  const { data: addons, isLoading: loadingAddons } = usePackageAddons(selection.packageId);

  useEffect(() => {
    if (items.length > 0 || selection.packageId) {
        fetchServerPricing();
    }
  }, [items.length, selection.packageId, fetchServerPricing]);

  const isCatering = selection.categoryName === "Catering";

  const handleNext = () => {
    router.push("/customer/booking/review");
  };

  return (
    <div className="bg-white min-h-screen">
      <EventSummary />
      <BookingProgress currentStep={4} />

      <main className="max-w-7xl mx-auto px-4 pt-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Form Area */}
          <div className="lg:col-span-8 space-y-10">
            <div className="space-y-1">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight italic uppercase">Menu & Add-ons</h1>
              <p className="text-slate-500 font-medium">Customize your package with extra services and preferences.</p>
            </div>

            {/* Section 1: Menu Selection (Catering Only) */}
            {isCatering && (
              <Card className="p-8 border-none shadow-sm rounded-[24px] bg-white space-y-8">
                <div className="flex items-center gap-3 border-b pb-6">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Utensils className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase italic">Menu Selection</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Included in your package</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {["Starters (Any 3)", "Main Course (Any 5)", "Desserts (Any 2)", "Welcome Drinks"].map((cat) => (
                    <div key={cat} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-sm transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-sm font-bold text-slate-700">{cat}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase text-[#6D28D9] hover:bg-[#6D28D9]/5">
                        Configure
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-3">
                  <Info className="h-4 w-4 text-emerald-500 mt-0.5" />
                  <p className="text-[10px] text-emerald-700 font-medium leading-relaxed uppercase tracking-tight">
                    The standard menu items are included in your base price. Specialty dishes may incur extra charges.
                  </p>
                </div>
              </Card>
            )}

            {/* Section 2: Optional Add-ons */}
            <Card className="p-8 border-none shadow-sm rounded-[24px] bg-white space-y-8">
              <div className="flex items-center justify-between border-b pb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase italic">Optional Add-ons</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Premium upgrades</p>
                  </div>
                </div>
              </div>

              {loadingAddons ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
                </div>
              ) : !addons || addons.length === 0 ? (
                <div className="p-10 text-center border-2 border-dashed rounded-[24px] border-slate-100">
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest italic">No add-ons available for this package.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addons.map((addon: any) => {
                    const isSelected = selection.selectedAddonIds?.includes(addon.id);
                    return (
                      <button
                        key={addon.id}
                        onClick={() => toggleAddon(addon.id)}
                        className={cn(
                          "p-6 rounded-2xl border-2 transition-all text-left flex justify-between items-center group relative overflow-hidden",
                          isSelected
                            ? "border-[#6D28D9] bg-[#6D28D9]/5 shadow-sm"
                            : "border-slate-50 bg-slate-50/50 hover:border-[#6D28D9]/30 hover:bg-white"
                        )}
                      >
                        <div className="relative z-10">
                          <h4 className="font-black text-xs uppercase tracking-widest text-slate-900 mb-1">{addon.name}</h4>
                          <p className="text-[10px] font-bold text-[#6D28D9]">{formatCurrency(addon.price)}</p>
                        </div>
                        <div className={cn(
                          "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all relative z-10",
                          isSelected ? "bg-[#6D28D9] border-[#6D28D9] text-white" : "border-slate-200 bg-white text-slate-300"
                        )}>
                          {isSelected ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </div>
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Zap className="h-16 w-16 text-[#6D28D9]" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>

            <div className="pt-10 flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => router.push("/customer/booking/venue")}
                className="text-slate-400 font-black uppercase tracking-widest hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                className="h-16 px-12 rounded-2xl font-black text-lg bg-[#6D28D9] hover:bg-[#6D28D9]/90 shadow-xl shadow-[#6D28D9]/20 group"
                onClick={handleNext}
              >
                Continue to Review
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
