"use client";

import { useState, useEffect, memo } from "react";
import { motion } from "framer-motion";
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
  XCircle,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Sequential flow: Event Type > Category > Subcategory > Service Type > Package > Guest/Date > Review.
const currentSteps = [
  { id: 1, title: "Event Type", subtitle: "What are you celebrating?" },
  { id: 2, title: "Category", subtitle: "Select your event theme" },
  { id: 3, title: "Sub Category", subtitle: "What are you looking for?" },
  { id: 4, title: "Service Type", subtitle: "Pick a specific service type" },
  { id: 5, title: "Package", subtitle: "Choose a curated deal" },
  { id: 6, title: "Guest & Date", subtitle: "Set your event scale" },
  { id: 7, title: "Review", subtitle: "Confirm and proceed" },
];

import {
  useEventTypes,
  useCategories,
  useSubcategories,
  useServiceTypes,
  usePackages
} from "@/hooks/useBookingData";
import { toast } from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { useCommerceStore } from "@/store/commerceStore";
import { Label } from "@/components/ui/label";
import { bookingService } from "@/services";

import { useRouter } from "next/navigation";
import { useCheckoutStore } from "@/store/checkoutStore";
import { Skeleton } from "@/components/ui/skeleton";

import { calculateGST, calculatePlatformFee } from "@/utils/calculation";
import { BUSINESS_CONFIG } from "@/constants/config";

function BookingWizard({ vendor }: { vendor: any }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addToCart: addToStore } = useCommerceStore();
  const { setVendorInfo, setGuestInfo, setDateTime, setPricing, resetCheckout } = useCheckoutStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [selection, setSelection] = useState({
    eventType: null as any,
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
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Data fetching
  const { data: eventTypes, isLoading: loadingEvents } = useEventTypes();
  const { data: categories, isLoading: loadingCats } = useCategories(selection.eventType?.id, vendor?.id);
  const { data: subcategories, isLoading: loadingSubs } = useSubcategories(selection.category?.id, vendor?.id);
  const { data: serviceTypes, isLoading: loadingTypes } = useServiceTypes(selection.subcategory?.id, vendor?.id);
  const { data: packages, isLoading: loadingPkgs } = usePackages(selection.serviceType?.id, vendor?.id);

  // Dynamic Auto-select logic: Skips steps with only 1 option to speed up UX
  useEffect(() => {
    // Only auto-advance if we're not currently loading data for the next step
    const isNextLoading = loadingEvents || loadingCats || loadingSubs || loadingTypes || loadingPkgs;
    if (isNextLoading) return;

    if (currentStep === 1 && eventTypes?.length === 1 && !selection.eventType) {
      setSelection(prev => ({ ...prev, eventType: eventTypes[0] }));
      setCurrentStep(2);
    } else if (currentStep === 2 && categories?.length === 1 && !selection.category) {
      setSelection(prev => ({ ...prev, category: categories[0] }));
      setCurrentStep(3);
    } else if (currentStep === 3 && subcategories?.length === 1 && !selection.subcategory) {
      setSelection(prev => ({ ...prev, subcategory: subcategories[0] }));
      setCurrentStep(4);
    } else if (currentStep === 4 && serviceTypes?.length === 1 && !selection.serviceType) {
      setSelection(prev => ({ ...prev, serviceType: serviceTypes[0] }));
      setCurrentStep(5);
    } else if (currentStep === 5 && packages?.length === 1 && !selection.package) {
      setSelection(prev => ({ ...prev, package: packages[0] }));
      setCurrentStep(6);
    }
  }, [eventTypes, categories, subcategories, serviceTypes, packages, currentStep, selection, loadingEvents, loadingCats, loadingSubs, loadingTypes, loadingPkgs]);

  const checkAvailability = async (date: string) => {
    if (!vendor?.id || !date) return;
    setIsCheckingAvailability(true);
    setAvailabilityError(null);
    try {
      const data = await bookingService.checkAvailability(vendor.id, date);
      if (!data.available) {
        setAvailabilityError(data.reason || "Vendor is not available on this date");
        toast.error(data.reason || "Vendor is not available on this date");
      } else {
        toast.success("Vendor is available!");
      }
    } catch {
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
      const rule = pkg.pricingrule?.find((r: any) =>
        selection.guestCount >= r.minGuests && selection.guestCount <= r.maxGuests
      );

      const pricePerGuest = rule ? Number(rule.pricePerGuest) : 0;
      const flatFee = rule ? Number(rule.flatFee) : 0;

      const guestTotal = pricePerGuest * selection.guestCount;
      const subTotal = basePrice + guestTotal + flatFee;
      const platformFee = calculatePlatformFee(subTotal);
      const gst = calculateGST(subTotal + platformFee);
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

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 7));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleConfirm = () => {
    if (!selection.package || !selection.eventDate) {
      toast.error("Please select a package and event date");
      return;
    }

    const bookingDetails = {
      vendorId: vendor.id,
      serviceId: selection.package?.serviceId || selection.package?.service?.id || selection.serviceType?.id,
      packageId: selection.package?.id,
      guestCount: selection.guestCount,
      eventDate: selection.eventDate,
      totalAmount: totalPrice,
      breakdown
    };

    if (user) {
      // Set checkout store state
      resetCheckout();
      setVendorInfo({
        vendorId: vendor.id,
        serviceId: selection.package?.serviceId || selection.package?.service?.id || selection.serviceType?.id,
        packageId: selection.package?.id,
        vendorName: vendor.businessName,
        packageName: selection.package?.name,
        basePrice: selection.package?.price || 0,
      });
      setGuestInfo({ count: selection.guestCount, requirements: "" });
      setDateTime({ date: selection.eventDate, time: "12:00" });
      setPricing({
        subtotal: (breakdown?.base || 0) + (breakdown?.guests || 0) + (breakdown?.extra || 0),
        taxes: breakdown?.tax || 0,
        platformFee: breakdown?.platform || 0,
        total: totalPrice,
        breakdown
      });

      router.push(`/customer/checkout?vendorId=${vendor.id}&serviceId=${selection.serviceType?.id}&packageId=${selection.package?.id}&guests=${selection.guestCount}&date=${selection.eventDate}`);
    } else {
      // Add to cart for guest users
      addToStore({
        id: Math.random().toString(36).substr(2, 9),
        type: "SERVICE",
        targetId: vendor.id,
        quantity: 1,
        details: {
          title: `${vendor.businessName} - ${selection.package.name}`,
          price: totalPrice,
          image: vendor.coverImage,
          ...bookingDetails
        }
      });
      toast.success("Added to shortlist. Please login to checkout.");
    }
  };

  const renderStepContent = () => {
    if (loadingEvents || loadingCats || loadingSubs || loadingTypes || loadingPkgs) {
        return (
            <div className="space-y-6 py-10">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-[2rem]" />
                    ))}
                </div>
                <div className="flex flex-col items-center justify-center space-y-4">
                    <p className="font-bold text-muted-foreground animate-pulse">Syncing latest rates...</p>
                </div>
            </div>
        );
    }

    switch (currentStep) {
      case 1: // Level 0: Event Type
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {eventTypes?.map((et: any) => (
              <button
                key={et.id}
                onClick={() => { setSelection({ ...selection, eventType: et, category: null, subcategory: null, serviceType: null, package: null }); nextStep(); }}
                className={cn(
                  "p-6 rounded-[2rem] border-2 transition-all text-left group",
                  selection.eventType?.id === et.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"
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

      case 2: // Level 1: Category
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories?.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => { setSelection({ ...selection, category: cat, subcategory: null, serviceType: null, package: null }); nextStep(); }}
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
            {categories?.length === 0 && <p className="col-span-full text-center py-10 text-muted-foreground font-bold italic">No categories available for this event type.</p>}
          </div>
        );

      case 3: // Level 2: Subcategory
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {subcategories?.map((sub: any) => (
                <button
                  key={sub.id}
                  onClick={() => { setSelection({ ...selection, subcategory: sub, serviceType: null, package: null }); nextStep(); }}
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

      case 4: // Level 3: Service Type
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
              {serviceTypes?.length === 0 && <p className="col-span-full text-center py-10 text-muted-foreground font-bold italic">No specific service types available for this selection.</p>}
            </div>
        );

      case 5: // Level 4: Package
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {packages?.map((pkg: any) => {
              let inclusions = [];
              try {
                inclusions = Array.isArray(pkg.inclusions)
                  ? pkg.inclusions
                  : (typeof pkg.inclusions === 'string' ? JSON.parse(pkg.inclusions) : []);
              } catch (e) {
                console.error("Failed to parse inclusions", e);
              }

              return (
                <GlassCard
                  key={pkg.id}
                  onClick={() => { setSelection({ ...selection, package: pkg }); nextStep(); }}
                  className={cn(
                    "cursor-pointer border-2 transition-all p-6 flex flex-col items-center text-center h-full",
                    selection.package?.id === pkg.id ? "border-primary bg-primary/5" : "border-white/10 hover:border-primary/20"
                  )}
                >
                  <h4 className="font-black text-xl mb-2">{pkg.name}</h4>
                  <p className="text-3xl font-black text-primary mb-6">₹{Number(pkg.price).toLocaleString('en-IN')}</p>
                  <div className="space-y-3 mb-8 text-left w-full flex-1">
                      {inclusions.slice(0, 6).map((inc: any, idx: number) => (
                          <div key={idx} className="text-[10px] font-bold flex items-start gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                              <span className="leading-tight">{inc}</span>
                          </div>
                      ))}
                      {inclusions.length > 6 && <p className="text-[10px] text-muted-foreground font-bold pl-5">+{inclusions.length - 6} more...</p>}
                  </div>
                  <Button variant={selection.package?.id === pkg.id ? "premium" : "outline"} className="w-full rounded-xl font-bold text-xs">
                    Select {pkg.name}
                  </Button>
                </GlassCard>
              );
            })}
            {packages?.length === 0 && <div className="col-span-full py-20 bg-secondary/20 rounded-[2.5rem] border border-dashed text-center italic font-bold text-muted-foreground">This vendor doesn&apos;t have packages for this service type yet.</div>}
          </div>
        );

      case 6: // Level 5: Guest Count
        return (
          <div className="space-y-10">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[50, 100, 200, 500, 1000].map(count => (
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

            <div className="space-y-4">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-2">Or Enter Custom Guest Count</Label>
              <div className="relative">
                <Users className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="number"
                  min="1"
                  placeholder="Enter number of guests"
                  className="w-full h-16 bg-secondary/30 rounded-2xl pl-16 pr-6 font-bold outline-none border-2 border-transparent focus:border-primary/50 transition-all"
                  value={selection.guestCount || ""}
                  onChange={(e) => setSelection({ ...selection, guestCount: parseInt(e.target.value) || 0 })}
                />
              </div>
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

      case 7: // Level 6: Detailed Review & Terms
        return (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div className="flex items-center gap-4 mb-2">
                         <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-primary" />
                         </div>
                         <h3 className="text-3xl font-black italic tracking-tight">Review Booking</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-6 bg-secondary/20 rounded-[2rem] border border-white/5 space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vendor</p>
                            <p className="font-bold text-lg">{vendor.businessName}</p>
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-amber-500">★ {vendor.rating || "New"}</span>
                                <span className="text-[10px] text-muted-foreground">({vendor.reviewCount || 0} reviews)</span>
                            </div>
                        </div>
                        <div className="p-6 bg-secondary/20 rounded-[2rem] border border-white/5 space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Service Package</p>
                            <p className="font-bold text-lg">{selection.package?.name}</p>
                            <p className="text-[10px] text-primary font-bold">PROFESSIONAL SERVICE</p>
                        </div>
                        <div className="p-6 bg-secondary/20 rounded-[2rem] border border-white/5 space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Event Date</p>
                            <p className="font-bold text-lg">{selection.eventDate ? format(new Date(selection.eventDate), 'PPP') : "Not Selected"}</p>
                            <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Preferred: 12:00 PM
                            </p>
                        </div>
                        <div className="p-6 bg-secondary/20 rounded-[2rem] border border-white/5 space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Guest Count</p>
                            <p className="font-bold text-lg">{selection.guestCount} Guests</p>
                            <p className="text-[10px] text-muted-foreground font-bold">SCALED PRICING APPLIED</p>
                        </div>
                    </div>

                    <div className="p-8 bg-blue-500/5 rounded-[2.5rem] border border-blue-500/10 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="h-5 w-5 text-blue-500" />
                            <h4 className="font-black text-sm uppercase tracking-widest text-blue-600">Mana Trust Guarantee</h4>
                        </div>
                        <p className="text-xs font-medium text-blue-700/80 leading-relaxed">
                            Your payment is held in secure escrow and only released to the vendor after service completion. You are covered by our 100% Satisfaction Guarantee and Cancellation Policy.
                        </p>
                        <div className="flex items-center gap-3 pt-2">
                             <div className="flex items-center gap-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Verified Vendor</span>
                             </div>
                             <div className="flex items-center gap-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Secure Checkout</span>
                             </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 px-4">
                        <div className="pt-1">
                            <input
                                type="checkbox"
                                id="terms"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                            />
                        </div>
                        <label htmlFor="terms" className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-tight">
                            I agree to the <span className="text-primary cursor-pointer hover:underline">Terms of Service</span>, <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>, and <span className="text-primary cursor-pointer hover:underline">Cancellation Policy</span> of Mana Events.
                        </label>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-b from-primary/10 to-transparent blur-3xl opacity-50 rounded-full" />
                    <GlassCard className="p-10 flex flex-col justify-between h-full relative border-primary/20 bg-black/40 backdrop-blur-3xl shadow-2xl">
                        <div>
                            <div className="flex justify-between items-center mb-8">
                                <h4 className="font-black text-2xl italic">Payment Summary</h4>
                                <ShoppingCart className="h-6 w-6 text-primary" />
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-muted-foreground uppercase tracking-widest text-[10px]">Base Package</span>
                                    <span>₹{Number(breakdown?.base || 0).toLocaleString('en-IN')}</span>
                                </div>
                                {breakdown?.guests > 0 && (
                                    <div className="flex justify-between text-sm font-bold">
                                        <span className="text-muted-foreground uppercase tracking-widest text-[10px]">Guest Scaling ({selection.guestCount} pax)</span>
                                        <span>₹{Number(breakdown.guests).toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                                {breakdown?.extra > 0 && (
                                    <div className="flex justify-between text-sm font-bold">
                                        <span className="text-muted-foreground uppercase tracking-widest text-[10px]">Additional Fees</span>
                                        <span>₹{Number(breakdown.extra).toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                                <div className="h-px bg-white/5 my-4" />
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-muted-foreground uppercase tracking-widest text-[10px]">Platform Fee ({BUSINESS_CONFIG.PLATFORM_FEE_PERCENTAGE}%)</span>
                                    <span>₹{Number(breakdown?.platform || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-muted-foreground uppercase tracking-widest text-[10px]">GST ({BUSINESS_CONFIG.GST_PERCENTAGE}%)</span>
                                    <span>₹{Number(breakdown?.tax || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="h-px bg-white/10 my-6" />
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Grand Total</p>
                                        <p className="text-4xl font-black tracking-tighter">₹{totalPrice.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Inclusive of taxes</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 space-y-4">
                            <Button
                                variant="premium"
                                className="w-full h-20 rounded-[1.5rem] font-black text-xl uppercase tracking-widest shadow-2xl shadow-primary/20 group overflow-hidden relative"
                                onClick={handleConfirm}
                                disabled={!termsAccepted}
                            >
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    Finalize Booking <ChevronRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-600 to-primary bg-[length:200%_100%] animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                            <p className="text-[9px] text-center font-bold text-muted-foreground uppercase tracking-widest">Secure encrypted checkout by Razorpay</p>
                        </div>
                    </GlassCard>
                </div>
            </div>
        );

      default:
        return <div className="py-20 text-center text-muted-foreground font-bold italic">This step is being initialized...</div>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      {/* Left: Step Content */}
      <div className="lg:col-span-8 space-y-8">
        <div className="flex items-center justify-between mb-8">
            <button onClick={prevStep} className={cn("flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors", currentStep === 1 && "invisible")}>
                <ArrowLeft className="h-4 w-4" /> BACK
            </button>
            <div className="flex gap-2">
                {currentSteps.map(s => (
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
            <h2 className="text-4xl font-black italic">{currentSteps[currentStep-1].title}</h2>
            <p className="text-muted-foreground font-medium text-lg mb-10">{currentSteps[currentStep-1].subtitle}</p>

            <div className="mt-10 min-h-[400px]">
                {renderStepContent()}
            </div>
        </motion.div>
      </div>

      {/* Right: Selection Summary (Sticky) */}
      <div className="lg:col-span-4">
        <div className="sticky top-32">
            <GlassCard className="p-8 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent rounded-[2.5rem]">
                <h3 className="font-black text-xl mb-8 italic flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    YOUR SELECTION
                </h3>

                <div className="space-y-5">
                    <div className="flex justify-between items-start border-b border-dashed border-border pb-4">
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Event Type</p>
                            <p className="font-bold">{selection.eventType?.name || "Not Selected"}</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-start border-b border-dashed border-border pb-4">
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Category</p>
                            <p className="font-bold">{selection.category?.name || "Not Selected"}</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-start border-b border-dashed border-border pb-4">
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sub Category</p>
                            <p className="font-bold">{selection.subcategory?.name || "Not Selected"}</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-start border-b border-dashed border-border pb-4">
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Service Type</p>
                            <p className="font-bold">{selection.serviceType?.name || "Not Selected"}</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-start border-b border-dashed border-border pb-4">
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Package</p>
                            <p className="font-bold">{selection.package?.name || "Not Selected"}</p>
                        </div>
                        {selection.package && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    </div>

                    <div className="flex justify-between items-start border-b border-dashed border-border pb-4">
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Guest Count</p>
                            <p className="font-bold">{selection.guestCount ? `${selection.guestCount} Guests` : "Not Selected"}</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-start border-b border-dashed border-border pb-4">
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Event Date</p>
                            <p className="font-bold">{selection.eventDate || "Not Selected"}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 p-8 bg-white dark:bg-black/20 rounded-3xl border border-primary/10 shadow-inner">
                    <p className="text-[10px] font-black text-center text-muted-foreground uppercase tracking-[0.2em] mb-3">Total Estimated Price</p>
                    <div className="text-center">
                        <span className="text-sm font-bold text-primary mr-1">₹</span>
                        <span className="text-5xl font-black tracking-tighter">
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

export default memo(BookingWizard);
