"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Sparkles,
  ShoppingCart,
  ArrowLeft,
  RefreshCw,
  MapPin,
  ShoppingBag,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LocationPicker } from "@/components/maps/LocationPicker";

import {
  useEventTypes,
  useCategories,
  useSubcategories,
  useServiceTypes,
  usePackages,
  usePackageAddons
} from "@/hooks/useBookingData";
import { useCart, useAddToCart, useIsInCart } from "@/hooks/use-commerce";
import { toast } from "react-hot-toast";
import { Label } from "@/components/ui/label";

import { useAuthStore } from "@/store/authStore";
import { useCheckoutStore } from "@/store/checkoutStore";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

const currentSteps = [
  { id: 1, title: "Event Type", subtitle: "What are you celebrating?" },
  { id: 2, title: "Category", subtitle: "Select your event theme" },
  { id: 3, title: "Sub Category", subtitle: "What are you looking for?" },
  { id: 4, title: "Service Type", subtitle: "Pick a specific service type" },
  { id: 5, title: "Package", subtitle: "Choose a curated deal" },
  { id: 6, title: "Add-ons", subtitle: "Customize with extras" },
  { id: 7, title: "Event Details", subtitle: "Set date, scale & location" },
  { id: 8, title: "Review", subtitle: "Confirm your selection" },
];

function BookingWizard({
  vendor,
  initialEventTypes
}: {
  vendor: any,
  initialEventTypes?: any[]
}) {
  const { user } = useAuthStore();

  const {
    step: currentStep,
    selection,
    eventDetails,
    pricing,
    isPricingLoading,
    setStep: setCurrentStep,
    setEventType,
    setCategory,
    setSubCategory,
    setServiceType,
    setPackage,
    toggleAddon,
    setVendor,
    setEventDetails,
    resetCheckout,
  } = useCheckoutStore();

  const [isMapOpen, setIsMapOpen] = useState(false);

  // Data fetching
  const { data: eventTypes, isLoading: loadingEvents } = useEventTypes(vendor?.id, initialEventTypes);
  const { data: categories, isLoading: loadingCats } = useCategories(selection.eventTypeId, vendor?.id);
  const { data: subcategories, isLoading: loadingSubs } = useSubcategories(selection.categoryId, vendor?.id);
  const { data: serviceTypes, isLoading: loadingTypes } = useServiceTypes(selection.subcategoryId, vendor?.id);
  const { data: packages, isLoading: loadingPkgs } = usePackages(selection.serviceTypeId, vendor?.id);
  const { data: addons, isLoading: loadingAddons } = usePackageAddons(selection.packageId);

  // Cart Data & Mutation
  const { isLoading: isCartLoading, error: cartError, refetch: refetchCart } = useCart();
  const isInCart = useIsInCart(vendor?.id, selection.packageId || undefined);
  const { mutate: addToCart, isPending: isAdding } = useAddToCart();

  // Reset logic: Only reset if vendor or package actually changes
  useEffect(() => {
    if (vendor?.id && selection.vendorId && selection.vendorId !== vendor.id) {
        resetCheckout();
        setVendor(vendor.id, vendor.businessName);
    } else if (vendor?.id && !selection.vendorId) {
        setVendor(vendor.id, vendor.businessName);
    }
  }, [vendor?.id, selection.vendorId, resetCheckout, setVendor, vendor?.businessName]);

  const nextStep = () => setCurrentStep((Math.min(currentStep + 1, 8)) as any);
  const prevStep = () => setCurrentStep((Math.max(currentStep - 1, 1)) as any);

  const handleAddToCart = () => {
    if (!selection.packageId) {
        toast.error("Please select a package first");
        return;
    }

    addToCart({
        type: "PACKAGE",
        targetId: selection.packageId,
        quantity: 1,
        vendorId: vendor.id,
        packageId: selection.packageId,
        eventDate: eventDetails.date || undefined,
        guestCount: eventDetails.guestCount,
        location: eventDetails.venue || undefined,
        metadata: {
            price: pricing.total,
            title: selection.packageName,
            vendorName: vendor.businessName,
        }
    });
  };

  const handleMapSelect = (loc: { address: string; lat: number; lng: number }) => {
    setEventDetails({
      venue: loc.address,
    });
    setIsMapOpen(false);
    toast.success("Location selected from map");
  };

  const renderStepContent = () => {
    const isStepLoading = (currentStep === 1 && loadingEvents) ||
                          (currentStep === 2 && loadingCats) ||
                          (currentStep === 3 && loadingSubs) ||
                          (currentStep === 4 && loadingTypes) ||
                          (currentStep === 5 && loadingPkgs) ||
                          (currentStep === 6 && loadingAddons);

    if (isStepLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-10">
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-40 rounded-[2.5rem]" />
                ))}
            </div>
        );
    }

    switch (currentStep) {
      case 1:
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {eventTypes?.map((et: any) => (
              <button
                key={et.id}
                onClick={() => { setEventType(et.id, et.name); nextStep(); }}
                className={cn(
                  "p-6 rounded-[2rem] border-2 transition-all text-left group",
                  selection.eventTypeId === et.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"
                )}
              >
                <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <span className="font-black text-sm uppercase tracking-widest">{et.name}</span>
              </button>
            ))}
          </div>
        );

      case 2:
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories?.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => { setCategory(cat.id, cat.name); nextStep(); }}
                className={cn(
                  "p-6 rounded-[2rem] border-2 transition-all text-left group",
                  selection.categoryId === cat.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"
                )}
              >
                <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <span className="font-black text-sm uppercase tracking-widest">{cat.name}</span>
              </button>
            ))}
          </div>
        );

      case 3:
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {subcategories?.map((sub: any) => (
                <button
                  key={sub.id}
                  onClick={() => { setSubCategory(sub.id, sub.name); nextStep(); }}
                  className={cn(
                    "p-6 rounded-[2rem] border-2 transition-all text-left group",
                    selection.subcategoryId === sub.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"
                  )}
                >
                  <span className="font-black text-sm uppercase tracking-widest">{sub.name}</span>
                </button>
              ))}
            </div>
        );

      case 4:
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {serviceTypes?.map((st: any) => (
                <button
                  key={st.id}
                  onClick={() => { setServiceType(st.id, st.name); nextStep(); }}
                  className={cn(
                    "p-6 rounded-[2rem] border-2 transition-all text-left group",
                    selection.serviceTypeId === st.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"
                  )}
                >
                  <h4 className="font-black text-sm uppercase tracking-widest mb-2">{st.name}</h4>
                </button>
              ))}
            </div>
        );

      case 5:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {packages?.map((pkg: any) => (
              <GlassCard
                key={pkg.id}
                onClick={() => { setPackage(pkg.id, pkg.name); nextStep(); }}
                className={cn(
                  "cursor-pointer border-2 transition-all p-6 flex flex-col items-center text-center h-full",
                  selection.packageId === pkg.id ? "border-primary bg-primary/5" : "border-white/10 hover:border-primary/20"
                )}
              >
                <h4 className="font-black text-xl mb-2">{pkg.name}</h4>
                <p className="text-3xl font-black text-primary mb-6">₹{Number(pkg.price).toLocaleString('en-IN')}</p>
                <Button variant={selection.packageId === pkg.id ? "premium" : "outline"} className="w-full rounded-xl">
                  Select {pkg.name}
                </Button>
              </GlassCard>
            ))}
          </div>
        );

      case 6:
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addons?.map((addon: any) => (
                        <button
                            key={addon.id}
                            onClick={() => toggleAddon(addon.id)}
                            className={cn(
                                "p-6 rounded-2xl border-2 transition-all text-left flex justify-between items-center group",
                                selection.selectedAddonIds?.includes(addon.id) ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"
                            )}
                        >
                            <div>
                                <h4 className="font-black text-sm uppercase tracking-widest">{addon.name}</h4>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-primary">+₹{Number(addon.price).toLocaleString('en-IN')}</p>
                            </div>
                        </button>
                    ))}
                </div>
                <Button className="w-full h-16 rounded-2xl text-lg font-black" variant="premium" onClick={nextStep}>
                    Continue to Details
                </Button>
            </div>
        );

      case 7:
        return (
          <div className="space-y-10">
            <div className="space-y-4">
              <Label className="text-xs font-black uppercase tracking-widest ml-2 text-muted-foreground">Guest Count</Label>
              <input
                type="number"
                className="w-full h-16 bg-secondary/30 rounded-2xl px-6 font-bold border-2 border-transparent focus:border-primary/50"
                value={eventDetails.guestCount || ""}
                onChange={(e) => setEventDetails({ guestCount: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                    type="date"
                    className="w-full h-16 bg-secondary/30 rounded-2xl px-6 font-bold border-2 border-transparent focus:border-primary/50"
                    value={eventDetails.date || ""}
                    onChange={(e) => setEventDetails({ date: e.target.value })}
                />
                <input
                    type="time"
                    className="w-full h-16 bg-secondary/30 rounded-2xl px-6 font-bold border-2 border-transparent focus:border-primary/50"
                    value={eventDetails.time || "12:00"}
                    onChange={(e) => setEventDetails({ time: e.target.value })}
                />
            </div>

            <div className="relative">
                <input
                    placeholder="Full Venue Address"
                    className="w-full h-16 bg-secondary/30 rounded-2xl px-6 pr-24 font-bold border-2 border-transparent focus:border-primary/50"
                    value={eventDetails.venue || ""}
                    onChange={(e) => setEventDetails({ venue: e.target.value })}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button onClick={() => setIsMapOpen(true)} className="p-3 text-primary"><MapPin className="h-5 w-5" /></button>
                </div>
            </div>

            <Button
                className="w-full h-16 rounded-2xl text-lg font-black"
                variant="premium"
                onClick={nextStep}
                disabled={!eventDetails.date || (eventDetails.venue?.length ?? 0) < 5}
            >
                Review Selection
            </Button>
          </div>
        );

      case 8:
        return (
            <div className="space-y-6">
                <div className="p-8 bg-white border rounded-3xl text-left shadow-sm">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{vendor.businessName}</p>
                    <h4 className="text-2xl font-black italic uppercase">{selection.packageName}</h4>
                    <div className="grid grid-cols-2 gap-10 mt-8">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Event Date</p>
                            <p className="font-black text-slate-900">{eventDetails.date || "Not set"}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Guest Count</p>
                            <p className="font-black text-slate-900">{eventDetails.guestCount} Guests</p>
                        </div>
                    </div>
                </div>

                {renderActionButton()}

                {!user && (
                    <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest animate-pulse">
                        Sign in to sync your cart across devices.
                    </p>
                )}
            </div>
        );

      default:
        return null;
    }
  };

  const renderActionButton = () => {
    if (cartError) {
        return (
            <Button
                onClick={() => refetchCart()}
                className="w-full h-16 rounded-2xl bg-rose-50 text-rose-600 border-2 border-rose-100 hover:bg-rose-100 font-bold"
            >
                <RefreshCw className="h-5 w-5 mr-2 animate-spin-slow" /> Unable to load cart. Retry?
            </Button>
        );
    }

    if (isCartLoading) {
        return (
            <Button disabled className="w-full h-16 rounded-2xl bg-slate-100 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading Cart...
            </Button>
        );
    }

    if (!user) {
        return (
            <Button className="w-full h-16 rounded-2xl font-black text-lg uppercase" variant="premium" asChild>
                <Link href="/login">Login to Add to Cart</Link>
            </Button>
        );
    }

    if (isInCart) {
        return (
            <div className="flex gap-4">
                <Button className="flex-1 h-16 rounded-2xl font-black text-lg bg-emerald-50 text-emerald-600 border-2 border-emerald-100 hover:bg-emerald-100" disabled>
                    <CheckCircle2 className="h-5 w-5 mr-2" /> Added to Cart
                </Button>
                <Button className="h-16 px-8 rounded-2xl font-black uppercase" variant="premium" asChild>
                    <Link href="/customer/cart">View Cart <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
            </div>
        );
    }

    return (
        <Button
            variant="premium"
            className="w-full h-16 rounded-2xl font-black text-lg uppercase tracking-widest"
            onClick={handleAddToCart}
            disabled={isAdding}
        >
            {isAdding ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <ShoppingBag className="h-5 w-5 mr-2" />}
            {isAdding ? "Adding..." : "Add to Shopping Cart"}
        </Button>
    );
  };

  return (
    <div className="space-y-12">
        <div className="flex items-center justify-between">
            <button onClick={prevStep} className={cn("flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 hover:text-primary transition-colors uppercase", currentStep === 1 && "invisible")}>
                <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div className="flex gap-1.5">
                {currentSteps.map(s => (
                    <div key={s.id} className={cn("h-1 w-6 md:w-8 rounded-full transition-all duration-500", s.id <= currentStep ? "bg-primary" : "bg-slate-100")} />
                ))}
            </div>
        </div>

        <div className="flex flex-col gap-1">
            <span className="text-primary font-black text-[10px] uppercase tracking-[0.3em]">Step 0{currentStep} / 08</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none italic uppercase">{currentSteps[currentStep-1].title}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8">
                <motion.div key={currentStep} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }}>
                    <div className="min-h-[400px]">{renderStepContent()}</div>
                </motion.div>
            </div>

            <div className="lg:col-span-4 lg:sticky lg:top-32">
                <GlassCard className="p-8 border border-slate-100 bg-white/50 backdrop-blur-xl rounded-[24px] shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
                        <ShoppingCart className="h-5 w-5 text-slate-900" />
                        <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight italic">Selection</h3>
                    </div>

                    <div className="space-y-4">
                        {[
                            { label: "Vendor", value: vendor.businessName },
                            { label: "Package", value: selection.packageName },
                            { label: "Date", value: eventDetails.date },
                            { label: "Guests", value: eventDetails.guestCount ? `${eventDetails.guestCount}` : null },
                        ].map((row, i) => (
                            <div key={i} className="flex justify-between items-start gap-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">{row.label}</p>
                                <p className="font-black text-slate-900 text-xs truncate text-right">{row.value || "—"}</p>
                            </div>
                        ))}
                    </div>

                    {selection.packageId && (
                        <div className="mt-8 pt-6 border-t border-slate-100 space-y-4 relative">
                            {isPricingLoading && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10"><RefreshCw className="animate-spin h-5 w-5 text-primary" /></div>}
                            <div className="flex justify-between items-center pt-4 border-t border-slate-50"><span className="text-xs font-black text-primary uppercase">Est. Total</span><span className="font-black text-xl text-slate-900">₹{pricing.total.toLocaleString()}</span></div>
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>

        <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
            <DialogContent className="max-w-3xl">
                <DialogHeader><DialogTitle>Select Event Location</DialogTitle></DialogHeader>
                <LocationPicker onLocationSelect={handleMapSelect} />
            </DialogContent>
        </Dialog>
    </div>
  );
}

export default BookingWizard;
