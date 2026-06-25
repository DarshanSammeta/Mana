"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  Users,
  Sparkles,
  ShoppingCart,
  Info,
  ArrowLeft,
  Calendar as CalendarIcon,
  RefreshCw,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
  subtitle: string;
}

const STEPS: Step[] = [
  { id: 1, title: "Category", subtitle: "What are you planning?" },
  { id: 2, title: "Service", subtitle: "Select service type" },
  { id: 3, title: "Options", subtitle: "Specific preferences" },
  { id: 4, title: "Package", subtitle: "Choose your tier" },
  { id: 5, title: "Guests", subtitle: "Capacity & Date" },
  { id: 6, title: "Confirm", subtitle: "Review & Cart" },
];

import {
  useCategories,
  useSubcategories,
  useServiceTypes,
  usePackages
} from "@/hooks/useBookingData";
import { toast } from "react-hot-toast";
import axios from "axios";

export default function BookingWizard({ vendor }: { vendor: any }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selection, setSelection] = useState({
    category: null as any,
    subcategory: null as any,
    serviceType: null as any,
    package: null as any,
    guestCount: 100,
    eventDate: "",
  });

  const [totalPrice, setTotalPrice] = useState(0);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Data fetching
  const { data: categories, isLoading: loadingCats } = useCategories();
  const { data: subcategories, isLoading: loadingSubs } = useSubcategories(selection.category?.id);
  const { data: serviceTypes, isLoading: loadingTypes } = useServiceTypes(selection.subcategory?.id);
  const { data: packages, isLoading: loadingPkgs } = usePackages(selection.serviceType?.id, vendor?.id);

  const checkAvailability = async (date: string) => {
    if (!vendor?.id || !date) return;
    setIsCheckingAvailability(true);
    setAvailabilityError(null);
    try {
      const res = await axios.post("/api/vendor/availability/check", {
        vendorId: vendor.id,
        date: date
      });
      if (!res.data.available) {
        setAvailabilityError(res.data.reason || "Vendor is not available on this date");
        toast.error(res.data.reason || "Vendor is not available on this date");
      } else {
        toast.success("Vendor is available!");
      }
    } catch (error) {
      toast.error("Failed to check availability");
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Auto-calculate price based on Level 6 logic
  useEffect(() => {
    if (selection.package) {
      const pkg = selection.package;
      const basePrice = Number(pkg.price);

      // Find matching pricing rule for guest count
      const rule = pkg.pricingRules?.find((r: any) =>
        selection.guestCount >= r.minGuests && selection.guestCount <= r.maxGuests
      );

      const pricePerGuest = rule ? Number(rule.pricePerGuest) : 0;
      const flatFee = rule ? Number(rule.flatFee) : 0;

      const guestTotal = pricePerGuest * selection.guestCount;
      const subTotal = basePrice + guestTotal + flatFee;
      const platformFee = subTotal * 0.05; // 5% platform fee
      const gst = (subTotal + platformFee) * 0.18; // 18% GST
      const finalTotal = subTotal + platformFee + gst;

      setTotalPrice(finalTotal);
      setBreakdown({
        base: basePrice,
        guests: guestTotal,
        extra: flatFee,
        platform: platformFee,
        tax: gst,
        total: finalTotal
      });
    }
  }, [selection]);

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 6));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const renderStepContent = () => {
    if (loadingCats || loadingSubs || loadingTypes || loadingPkgs) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="font-bold text-muted-foreground animate-pulse">Fetching latest rates...</p>
            </div>
        );
    }

    switch (currentStep) {
      case 1: // Level 1: Category
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories?.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => { setSelection({ ...selection, category: cat, subcategory: null }); nextStep(); }}
                className={cn(
                  "p-6 rounded-[2rem] border-2 transition-all text-left group",
                  selection.category?.id === cat.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"
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

      case 2: // Level 2: Subcategory
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {subcategories?.map((sub: any) => (
                <button
                  key={sub.id}
                  onClick={() => { setSelection({ ...selection, subcategory: sub, serviceType: null }); nextStep(); }}
                  className={cn(
                    "p-6 rounded-[2rem] border-2 transition-all text-left group",
                    selection.subcategory?.id === sub.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"
                  )}
                >
                  <span className="font-black text-sm uppercase tracking-widest">{sub.name}</span>
                </button>
              ))}
              {subcategories?.length === 0 && <p className="col-span-full text-center py-10 text-muted-foreground font-bold italic">No subcategories available for this category.</p>}
            </div>
        );

      case 3: // Level 3: Service Type
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {serviceTypes?.map((st: any) => (
                <button
                  key={st.id}
                  onClick={() => { setSelection({ ...selection, serviceType: st, package: null }); nextStep(); }}
                  className={cn(
                    "p-6 rounded-[2rem] border-2 transition-all text-left group",
                    selection.serviceType?.id === st.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"
                  )}
                >
                  <h4 className="font-black text-sm uppercase tracking-widest mb-2">{st.name}</h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">{st.description}</p>
                </button>
              ))}
            </div>
        );

      case 4: // Level 4: Package
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages?.map((pkg: any) => (
              <GlassCard
                key={pkg.id}
                onClick={() => { setSelection({ ...selection, package: pkg }); nextStep(); }}
                className={cn(
                  "cursor-pointer border-2 transition-all p-8 flex flex-col items-center text-center",
                  selection.package?.id === pkg.id ? "border-primary" : "border-white/10"
                )}
              >
                <h4 className="font-black text-xl mb-2">{pkg.name}</h4>
                <p className="text-3xl font-black text-primary mb-6">₹{Number(pkg.price).toLocaleString('en-IN')}</p>
                <div className="space-y-3 mb-8 text-left w-full">
                    {pkg.inclusions && (Array.isArray(pkg.inclusions) ? pkg.inclusions : JSON.parse(pkg.inclusions as string)).map((inc: any, idx: number) => (
                        <div key={idx} className="text-xs font-bold flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="leading-tight">{inc}</span>
                        </div>
                    ))}
                </div>
                <Button variant={selection.package?.id === pkg.id ? "premium" : "outline"} className="w-full rounded-xl font-bold">
                  Select {pkg.name}
                </Button>
              </GlassCard>
            ))}
            {packages?.length === 0 && <div className="col-span-full py-20 bg-secondary/20 rounded-[2.5rem] border border-dashed text-center italic font-bold text-muted-foreground">This vendor doesn't have packages for this service type yet.</div>}
          </div>
        );

      case 5: // Level 5: Guest Count
        return (
          <div className="space-y-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[100, 300, 500, 1000].map(count => (
                <button
                  key={count}
                  onClick={() => setSelection({ ...selection, guestCount: count })}
                  className={cn(
                    "p-6 rounded-3xl border-2 font-black transition-all",
                    selection.guestCount === count ? "border-primary bg-primary/5 text-primary" : "border-border/50"
                  )}
                >
                  {count} Guests
                </button>
              ))}
            </div>

            <div className="bg-secondary/30 p-8 rounded-[2rem] border border-dashed border-border">
                <div className="flex items-center gap-4 mb-6">
                    <CalendarIcon className="h-6 w-6 text-primary" />
                    <h4 className="font-black">Pick Event Date</h4>
                </div>
                <div className="space-y-4">
                  <input
                      type="date"
                      className={cn(
                        "w-full h-16 bg-background rounded-2xl px-6 font-bold outline-none border-2 transition-all",
                        availabilityError ? "border-rose-500" : "border-transparent focus:border-primary/50"
                      )}
                      value={selection.eventDate}
                      onChange={(e) => {
                        setSelection({...selection, eventDate: e.target.value});
                        checkAvailability(e.target.value);
                      }}
                  />
                  {isCheckingAvailability && (
                    <p className="text-xs font-bold text-primary animate-pulse flex items-center gap-2">
                       <RefreshCw className="h-3 w-3 animate-spin" /> Checking vendor availability...
                    </p>
                  )}
                  {availabilityError && (
                    <p className="text-xs font-bold text-rose-500 flex items-center gap-2">
                       <XCircle className="h-3 w-3" /> {availabilityError}
                    </p>
                  )}
                </div>
            </div>

            <Button
              className="w-full h-16 rounded-2xl text-lg font-black"
              variant="premium"
              onClick={nextStep}
              disabled={!!availabilityError || !selection.eventDate || isCheckingAvailability}
            >
                Continue to Review
            </Button>
          </div>
        );

      case 6: // Level 6: Review & Finalize
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Confirm Your Selection</h3>
                    <div className="space-y-4">
                        {[
                            { label: "Category", val: selection.category?.name },
                            { label: "Service", val: selection.subcategory?.name },
                            { label: "Type", val: selection.serviceType?.name },
                            { label: "Package", val: selection.package?.name },
                            { label: "Guests", val: selection.guestCount },
                            { label: "Date", val: selection.eventDate || "Not Selected" }
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-secondary/30 rounded-2xl border border-white/5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</span>
                                <span className="font-bold text-sm">{item.val}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <GlassCard className="p-8 flex flex-col justify-between">
                    <div>
                        <h4 className="font-black text-lg mb-6">Payment Summary</h4>
                        <div className="space-y-3">
                             <div className="flex justify-between font-bold">
                                <span>Subtotal</span>
                                <span>₹{((breakdown?.base || 0) + (breakdown?.guests || 0)).toLocaleString('en-IN')}</span>
                            </div>
                             <div className="flex justify-between text-muted-foreground text-sm">
                                <span>Taxes & Fees</span>
                                <span>₹{((breakdown?.platform || 0) + (breakdown?.tax || 0)).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="h-px bg-white/10 my-4" />
                            <div className="flex justify-between text-2xl font-black text-primary">
                                <span>Total Payable</span>
                                <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>
                    <Button variant="premium" className="w-full h-16 rounded-2xl font-black text-lg uppercase tracking-widest mt-8">
                        Confirm & Pay Deposit
                    </Button>
                </GlassCard>
            </div>
        );

      default:
        return <div className="py-20 text-center text-muted-foreground font-bold italic">This step is being initialized...</div>;
    }
  };

  const STEPS = [
    { id: 1, title: "Category", subtitle: "Select your event theme" },
    { id: 2, title: "Service", subtitle: "What are you looking for?" },
    { id: 3, title: "Type", subtitle: "Pick a specific service type" },
    { id: 4, title: "Package", subtitle: "Choose a curated deal" },
    { id: 5, title: "Guest & Date", subtitle: "Set your event scale" },
    { id: 6, title: "Review", subtitle: "Confirm and proceed" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      {/* Left: Step Content */}
      <div className="lg:col-span-8 space-y-8">
        <div className="flex items-center justify-between mb-8">
            <button onClick={prevStep} className={cn("flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors", currentStep === 1 && "invisible")}>
                <ArrowLeft className="h-4 w-4" /> BACK
            </button>
            <div className="flex gap-2">
                {STEPS.map(s => (
                    <div key={s.id} className={cn("h-1.5 w-8 rounded-full transition-all", s.id <= currentStep ? "bg-primary" : "bg-border/50")} />
                ))}
            </div>
        </div>

        <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-2"
        >
            <p className="text-primary font-black text-xs uppercase tracking-[0.3em]">Step 0{currentStep}</p>
            <h2 className="text-4xl font-black italic">{STEPS[currentStep-1].title}</h2>
            <p className="text-muted-foreground font-medium text-lg mb-10">{STEPS[currentStep-1].subtitle}</p>

            <div className="mt-10">
                {renderStepContent()}
            </div>
        </motion.div>
      </div>

      {/* Right: Selection Summary (Sticky) */}
      <div className="lg:col-span-4">
        <div className="sticky top-32">
            <GlassCard className="p-8 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent rounded-[2.5rem]">
                <h3 className="font-black text-xl mb-6 italic flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    YOUR SELECTION
                </h3>

                <div className="space-y-6">
                    <div className="flex justify-between items-start border-b border-dashed border-border pb-4">
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Category</p>
                            <p className="font-bold">{selection.category?.name || "Not selected"}</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-start border-b border-dashed border-border pb-4">
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Service</p>
                            <p className="font-bold">{selection.subcategory?.name || "Not selected"}</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-start border-b border-dashed border-border pb-4">
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Package</p>
                            <p className="font-bold">{selection.package?.name || "Not selected"}</p>
                        </div>
                        {selection.package && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    </div>

                    <div className="flex justify-between items-start border-b border-dashed border-border pb-4">
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Guest Count</p>
                            <p className="font-bold">{selection.guestCount} Guests</p>
                        </div>
                    </div>
                </div>

                <div className="mt-10 p-6 bg-white dark:bg-black/20 rounded-3xl border border-primary/10 shadow-inner">
                    <p className="text-[10px] font-black text-center text-muted-foreground uppercase tracking-[0.2em] mb-2">Total Estimated Price</p>
                    <div className="text-center">
                        <span className="text-sm font-bold text-primary mr-1">₹</span>
                        <span className="text-4xl font-black tracking-tighter">
                            {totalPrice.toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>

                <div className="mt-8 flex items-start gap-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                    <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <p className="text-[10px] font-bold text-blue-600 leading-relaxed uppercase tracking-tight">
                        Prices are auto-calculated based on vendor rates and your guest count requirements.
                    </p>
                </div>
            </GlassCard>
        </div>
      </div>
    </div>
  );
}
