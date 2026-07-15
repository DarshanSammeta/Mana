"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCheckoutStore } from "@/store/checkoutStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock,
  Info,
  RefreshCw,
  RefreshCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

import { customerService } from "@/services/client";
import { vendorService } from "@/services/client";
import { marketplaceService } from "@/services/client";

import { formatCurrency } from "@/utils/format";
import { calculateGST, calculatePlatformFee } from "@/utils/calculation";

import { BUSINESS_CONFIG } from "@/constants/config";
import { RAZORPAY_CONFIG } from "@/config/razorpay";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { toast } = useToast();

  const {
    step,
    eventDetails,
    guestInfo,
    dateTime,
    location,
    vendorInfo,
    pricing,
    setStep,
    setEventDetails,
    setGuestInfo,
    setDateTime,
    setLocation,
    setVendorInfo,
    resetCheckout
  } = useCheckoutStore();

  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [idempotencyKey] = useState(() => Math.random().toString(36).substring(7));

  // Initialize checkout with vendor info
  useEffect(() => {
    const vendorId = searchParams?.get("vendorId");
    const serviceId = searchParams?.get("serviceId");
    const packageId = searchParams?.get("packageId");
    const guests = searchParams?.get("guests");
    const date = searchParams?.get("date");

    // Only fetch if store is empty to avoid overwriting data passed from Wizard
    if (vendorId && serviceId && !vendorInfo.vendorId) {
      const fetchVendorData = async () => {
        try {
          const data = await marketplaceService.getVendorById(vendorId);
          const vendor = data.vendor;
          const service = serviceId ? vendor.service.find((s: any) => s.id === serviceId) : vendor.service[0];
          const pkg = packageId ? service.Renamedpackage.find((p: any) => p.id === packageId) : null;

          setVendorInfo({
            vendorId: vendorId,
            serviceId: serviceId || service.id,
            packageId: packageId || undefined,
            vendorName: vendor.businessName,
            packageName: pkg?.name,
            basePrice: pkg ? Number(pkg.price) : Number(service.basePrice),
          });

          if (guests) {
            setGuestInfo({ ...guestInfo, count: parseInt(guests) });
          }
          if (date) {
            setDateTime({ ...dateTime, date: date });
          }
        } catch {
          toast({ variant: "destructive", title: "Error", description: "Failed to load vendor information." });
        }
      };
      fetchVendorData();
    }
  }, [searchParams, vendorInfo.vendorId, setVendorInfo, guestInfo, setGuestInfo, dateTime, setDateTime, toast]);

  const validateAvailability = async () => {
    setIsValidating(true);
    setAvailabilityError(null);
    try {
      const res = await vendorService.checkAvailability({
        vendorId: vendorInfo.vendorId,
        date: dateTime.date,
      });

      if (res.available) {
        setStep(6);
      } else {
        setAvailabilityError(res.reason || "Vendor is not available on this date.");
      }
    } catch {
      setAvailabilityError("Error checking availability. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const razorpayLoaded = await loadRazorpay();
    if (!razorpayLoaded) {
      toast({ variant: "destructive", title: "Error", description: "Razorpay SDK failed to load." });
      setIsSubmitting(false);
      return;
    }

    try {
      const booking = await customerService.checkout({
        vendorId: vendorInfo.vendorId,
        eventName: eventDetails.name,
        eventType: eventDetails.type,
        eventDescription: eventDetails.description,
        eventDate: dateTime.date,
        eventTime: dateTime.time,
        eventLocation: location.address,
        landmark: location.landmark,
        city: location.city,
        state: location.state,
        pincode: location.pincode,
        guestCount: guestInfo.count,
        specialInstructions: guestInfo.requirements,
        totalAmount: pricing.total,
        subTotal: pricing.subtotal,
        taxAmount: pricing.taxes,
        idempotencyKey,
        items: [{
          serviceId: vendorInfo.serviceId,
          packageId: vendorInfo.packageId,
          price: vendorInfo.basePrice,
        }]
      });

      const orderRes = await customerService.createRazorpayOrder({
        amount: pricing.total,
      });

      const options = {
        key: RAZORPAY_CONFIG.keyId,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: "Mana Events",
        description: `Booking ID: ${booking.bookingNumber}`,
        order_id: orderRes.id,
        handler: async (response: any) => {
          try {
            await customerService.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking.id,
            });

            resetCheckout();
            router.push(`/customer/orders/success?bookingId=${booking.id}`);
          } catch {
            router.push(`/customer/orders/failed?bookingId=${booking.id}&reason=verification_failed`);
          }
        },
        prefill: {
          name: user?.fullName,
          email: user?.email,
          contact: user?.mobileNumber,
        },
        theme: { color: "#6C3CF0" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      setIsSubmitting(false);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: error.response?.data?.message || "Failed to initiate payment."
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Checkout Header (Simple) */}
      <header className="border-b border-slate-200 bg-white py-5 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 flex justify-between items-center">
          <Link href="/">
             <h1 className="text-2xl font-black tracking-tighter text-slate-900 flex items-baseline">
               mana<span className="text-primary">Events</span>
             </h1>
          </Link>
          <div className="flex items-center gap-3">
             <span className="text-lg font-black text-slate-900">Checkout</span>
             <span className="h-5 w-[1px] bg-slate-200 hidden sm:block"></span>
             <span className="text-slate-500 font-bold text-sm hidden sm:block">Step {step} of 7</span>
          </div>
          <div className="flex items-center text-slate-400 gap-1 text-xs font-bold uppercase tracking-widest">
             <Lock className="h-4 w-4" />
             <span className="hidden sm:inline">Secure</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Multi-step accordions */}
          <div className="lg:col-span-8 space-y-4">

            {/* Step 1: Event Details */}
            <div className={cn(
              "border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300",
              step === 1 ? "border-primary ring-4 ring-primary/5 shadow-2xl scale-[1.01]" : "bg-slate-50/50"
            )}>
              <div className={cn(
                "p-5 flex justify-between items-center",
                step === 1 ? "bg-slate-50 border-b border-slate-100" : ""
              )}>
                <div className="flex gap-4 items-center">
                  <span className={cn(
                    "font-black text-lg h-9 w-9 rounded-full flex items-center justify-center transition-all",
                    step === 1 ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-slate-200 text-slate-600"
                  )}>1</span>
                  <h2 className="font-black text-xl text-slate-900 tracking-tight">Event Details</h2>
                </div>
                {step > 1 && (
                  <button onClick={() => setStep(1)} className="text-primary text-sm font-black hover:underline uppercase tracking-wider">Change</button>
                )}
              </div>
              {step === 1 && (
                <div className="p-8 bg-white space-y-6">
                   <div className="space-y-5 max-w-md">
                      <div className="space-y-2">
                        <Label className="text-sm font-black text-slate-900 uppercase tracking-wider">Event Type</Label>
                        <Input
                          placeholder="e.g. Wedding, Birthday"
                          value={eventDetails.type}
                          className="h-12 rounded-xl border-slate-200 focus:ring-primary focus:border-primary"
                          onChange={e => setEventDetails({...eventDetails, type: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-black text-slate-900 uppercase tracking-wider">Event Name</Label>
                        <Input
                          placeholder="Give your event a name"
                          value={eventDetails.name}
                          className="h-12 rounded-xl border-slate-200 focus:ring-primary focus:border-primary"
                          onChange={e => setEventDetails({...eventDetails, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-black text-slate-900 uppercase tracking-wider">Description (Optional)</Label>
                        <Textarea
                          placeholder="Brief description"
                          value={eventDetails.description}
                          className="min-h-[100px] rounded-xl border-slate-200 focus:ring-primary focus:border-primary"
                          onChange={e => setEventDetails({...eventDetails, description: e.target.value})}
                        />
                      </div>
                      <Button
                        className="bg-primary hover:bg-blue-700 text-white font-black h-12 px-8 rounded-xl shadow-xl shadow-primary/20 border-none transition-all hover:-translate-y-0.5"
                        onClick={() => setStep(2)}
                        disabled={!eventDetails.type || eventDetails.name.length < 2}
                      >
                        Use this event details
                      </Button>
                   </div>
                </div>
              )}
            </div>

            {/* Step 2: Guest Information */}
            <div className={cn(
              "border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300",
              step === 2 ? "border-primary ring-4 ring-primary/5 shadow-2xl scale-[1.01]" : "bg-slate-50/50"
            )}>
              <div className={cn(
                "p-5 flex justify-between items-center",
                step === 2 ? "bg-slate-50 border-b border-slate-100" : ""
              )}>
                <div className="flex gap-4 items-center">
                  <span className={cn(
                    "font-black text-lg h-9 w-9 rounded-full flex items-center justify-center transition-all",
                    step === 2 ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-slate-200 text-slate-600"
                  )}>2</span>
                  <h2 className="font-black text-xl text-slate-900 tracking-tight">Guest Information</h2>
                </div>
                {step > 2 && (
                  <button onClick={() => setStep(2)} className="text-primary text-sm font-black hover:underline uppercase tracking-wider">Change</button>
                )}
              </div>
              {step === 2 && (
                <div className="p-8 bg-white space-y-6">
                   <div className="space-y-5 max-w-md">
                      <div className="space-y-2">
                        <Label className="text-sm font-black text-slate-900 uppercase tracking-wider">Estimated Guest Count</Label>
                        <Input
                          type="number"
                          value={guestInfo.count}
                          className="h-12 rounded-xl border-slate-200 focus:ring-primary"
                          onChange={e => setGuestInfo({...guestInfo, count: parseInt(e.target.value) || 0})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-black text-slate-900 uppercase tracking-wider">Special Instructions</Label>
                        <Textarea
                          placeholder="Any specific requests or requirements?"
                          value={guestInfo.requirements}
                          className="min-h-[100px] rounded-xl border-slate-200 focus:ring-primary"
                          onChange={e => setGuestInfo({...guestInfo, requirements: e.target.value})}
                        />
                      </div>
                      <Button
                        className="bg-primary hover:bg-blue-700 text-white font-black h-12 px-8 rounded-xl shadow-xl shadow-primary/20 border-none transition-all hover:-translate-y-0.5"
                        onClick={() => setStep(3)}
                      >
                        Continue to scheduling
                      </Button>
                   </div>
                </div>
              )}
            </div>

            {/* Step 3: Date & Time */}
            <div className={cn(
              "border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300",
              step === 3 ? "border-primary ring-4 ring-primary/5 shadow-2xl scale-[1.01]" : "bg-slate-50/50"
            )}>
              <div className={cn(
                "p-5 flex justify-between items-center",
                step === 3 ? "bg-slate-50 border-b border-slate-100" : ""
              )}>
                <div className="flex gap-4 items-center">
                  <span className={cn(
                    "font-black text-lg h-9 w-9 rounded-full flex items-center justify-center transition-all",
                    step === 3 ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-slate-200 text-slate-600"
                  )}>3</span>
                  <h2 className="font-black text-xl text-slate-900 tracking-tight">Date & Time</h2>
                </div>
                {step > 3 && (
                  <button onClick={() => setStep(3)} className="text-primary text-sm font-black hover:underline uppercase tracking-wider">Change</button>
                )}
              </div>
              {step === 3 && (
                <div className="p-8 bg-white space-y-6">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-md">
                      <div className="space-y-2">
                        <Label className="text-sm font-black text-slate-900 uppercase tracking-wider">Event Date</Label>
                        <Input
                          type="date"
                          className="h-12 rounded-xl border-slate-200 focus:ring-primary"
                          value={dateTime.date}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => setDateTime({...dateTime, date: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-black text-slate-900 uppercase tracking-wider">Start Time</Label>
                        <Input
                          type="time"
                          className="h-12 rounded-xl border-slate-200 focus:ring-primary"
                          value={dateTime.time}
                          onChange={e => setDateTime({...dateTime, time: e.target.value})}
                        />
                      </div>
                   </div>
                   <Button
                      className="bg-primary hover:bg-blue-700 text-white font-black h-12 px-8 rounded-xl shadow-xl shadow-primary/20 border-none transition-all hover:-translate-y-0.5"
                      onClick={() => setStep(4)}
                      disabled={!dateTime.date || !dateTime.time}
                   >
                     Confirm date & time
                   </Button>
                </div>
              )}
            </div>

            {/* Step 4: Location */}
            <div className={cn(
              "border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300",
              step === 4 ? "border-primary ring-4 ring-primary/5 shadow-2xl scale-[1.01]" : "bg-slate-50/50"
            )}>
              <div className={cn(
                "p-5 flex justify-between items-center",
                step === 4 ? "bg-slate-50 border-b border-slate-100" : ""
              )}>
                <div className="flex gap-4 items-center">
                  <span className={cn(
                    "font-black text-lg h-9 w-9 rounded-full flex items-center justify-center transition-all",
                    step === 4 ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-slate-200 text-slate-600"
                  )}>4</span>
                  <h2 className="font-black text-xl text-slate-900 tracking-tight">Location Details</h2>
                </div>
                {step > 4 && (
                  <button onClick={() => setStep(4)} className="text-primary text-sm font-black hover:underline uppercase tracking-wider">Change</button>
                )}
              </div>
              {step === 4 && (
                <div className="p-8 bg-white space-y-6">
                   <div className="space-y-5 max-w-lg">
                      <div className="space-y-2">
                        <Label className="text-sm font-black text-slate-900 uppercase tracking-wider">Full Address</Label>
                        <Input
                          placeholder="Street address, building, apartment number"
                          value={location.address}
                          className="h-12 rounded-xl border-slate-200 focus:ring-primary"
                          onChange={e => setLocation({...location, address: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-sm font-black text-slate-900 uppercase tracking-wider">Landmark</Label>
                          <Input placeholder="e.g. Near Metro Station" value={location.landmark} className="h-12 rounded-xl border-slate-200 focus:ring-primary" onChange={e => setLocation({...location, landmark: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-black text-slate-900 uppercase tracking-wider">City</Label>
                          <Input placeholder="Enter city" value={location.city} className="h-12 rounded-xl border-slate-200 focus:ring-primary" onChange={e => setLocation({...location, city: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-black text-slate-900 uppercase tracking-wider">State</Label>
                          <Input placeholder="Enter state" value={location.state} className="h-12 rounded-xl border-slate-200 focus:ring-primary" onChange={e => setLocation({...location, state: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-black text-slate-900 uppercase tracking-wider">Pincode</Label>
                          <Input placeholder="6-digit code" maxLength={6} value={location.pincode} className="h-12 rounded-xl border-slate-200 focus:ring-primary" onChange={e => setLocation({...location, pincode: e.target.value})} />
                        </div>
                      </div>
                      <Button
                        className="bg-primary hover:bg-blue-700 text-white font-black h-12 px-8 rounded-xl shadow-xl shadow-primary/20 border-none transition-all hover:-translate-y-0.5"
                        onClick={() => setStep(5)}
                        disabled={location.address.length < 5 || !location.city || location.pincode.length < 6}
                      >
                        Deliver service here
                      </Button>
                   </div>
                </div>
              )}
            </div>

            {/* Step 5: Vendor Check */}
            <div className={cn(
              "border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300",
              step === 5 ? "border-primary ring-4 ring-primary/5 shadow-2xl scale-[1.01]" : "bg-slate-50/50"
            )}>
              <div className={cn(
                "p-5 flex justify-between items-center",
                step === 5 ? "bg-slate-50 border-b border-slate-100" : ""
              )}>
                <div className="flex gap-4 items-center">
                  <span className={cn(
                    "font-black text-lg h-9 w-9 rounded-full flex items-center justify-center transition-all",
                    step === 5 ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-slate-200 text-slate-600"
                  )}>5</span>
                  <h2 className="font-black text-xl text-slate-900 tracking-tight">Vendor Confirmation</h2>
                </div>
              </div>
              {step === 5 && (
                <div className="p-10 bg-white space-y-6 text-center">
                   <div className="h-24 w-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-primary font-black text-3xl mb-4 border-2 border-slate-100 shadow-sm">
                      {vendorInfo.vendorName[0]}
                   </div>
                   <h3 className="font-black text-2xl text-slate-900 tracking-tight">{vendorInfo.vendorName}</h3>
                   <p className="text-base text-slate-600 max-w-sm mx-auto leading-relaxed">
                     We&apos;re verifying availability for <span className="font-black text-slate-900">{new Date(dateTime.date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })}</span>. This usually takes just a few seconds.
                   </p>

                   {availabilityError && (
                      <div className="p-4 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-100 flex items-center justify-center gap-2 max-w-sm mx-auto mt-4 shadow-sm">
                         <AlertCircle className="h-5 w-5 shrink-0" /> {availabilityError}
                      </div>
                   )}

                   <div className="pt-6">
                      <Button
                        className="bg-primary hover:bg-blue-700 text-white font-black h-14 px-10 rounded-xl shadow-xl shadow-primary/20 border-none transition-all hover:-translate-y-0.5"
                        onClick={validateAvailability}
                        disabled={isValidating}
                      >
                        {isValidating ? (
                          <span className="flex items-center gap-2">
                            <RefreshCcw className="h-5 w-5 animate-spin" /> Validating...
                          </span>
                        ) : "Check Availability & Review"}
                      </Button>
                   </div>
                </div>
              )}
            </div>

            {/* Step 6: Final Review */}
            <div className={cn(
              "border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300",
              step === 6 ? "border-primary ring-4 ring-primary/5 shadow-2xl scale-[1.01]" : "bg-slate-50/50"
            )}>
              <div className={cn(
                "p-5 flex justify-between items-center",
                step === 6 ? "bg-slate-50 border-b border-slate-100" : ""
              )}>
                <div className="flex gap-4 items-center">
                  <span className={cn(
                    "font-black text-lg h-9 w-9 rounded-full flex items-center justify-center transition-all",
                    step === 6 ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-slate-200 text-slate-600"
                  )}>6</span>
                  <h2 className="font-black text-xl text-slate-900 tracking-tight">Review Order</h2>
                </div>
              </div>
              {step === 6 && (
                <div className="p-8 bg-white space-y-8">
                   <div className="grid md:grid-cols-2 gap-10 text-sm">
                      <div className="space-y-6">
                         <div>
                           <h4 className="font-black text-slate-900 mb-2 uppercase tracking-widest text-[10px]">Service Address</h4>
                           <p className="text-slate-600 leading-relaxed font-medium">{location.address}, {location.landmark && `${location.landmark}, `}{location.city}, {location.state} - {location.pincode}</p>
                         </div>
                         <div>
                           <h4 className="font-black text-slate-900 mb-2 uppercase tracking-widest text-[10px]">Event Timing</h4>
                           <p className="text-slate-600 leading-relaxed font-medium">{new Date(dateTime.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at <span className="text-slate-900 font-black">{dateTime.time}</span></p>
                         </div>
                      </div>
                      <div className="space-y-6">
                         <div>
                           <h4 className="font-black text-slate-900 mb-2 uppercase tracking-widest text-[10px]">Payment Method</h4>
                           <p className="text-slate-500 italic">Will be selected in the final step</p>
                         </div>
                         <div>
                           <h4 className="font-black text-slate-900 mb-2 uppercase tracking-widest text-[10px]">Vendor Summary</h4>
                           <p className="text-slate-900 font-black text-lg">{vendorInfo.vendorName}</p>
                           <p className="text-primary font-black text-xs uppercase tracking-tighter mt-0.5">{vendorInfo.packageName || "Professional Service Package"}</p>
                         </div>
                      </div>
                   </div>
                   <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                      <p className="text-xs text-slate-400 text-center md:text-left leading-relaxed max-w-md">By placing your order, you agree to Mana Events&apos; <span className="text-primary font-bold cursor-pointer hover:underline">Terms of Service</span> and <span className="text-primary font-bold cursor-pointer hover:underline">Cancellation Policy</span>.</p>
                      <Button
                        className="w-full md:w-auto bg-primary hover:bg-blue-700 text-white font-black h-14 px-10 rounded-xl shadow-xl shadow-primary/20 border-none transition-all hover:-translate-y-0.5"
                        onClick={() => setStep(7)}
                      >
                        Place Order & Pay
                      </Button>
                   </div>
                </div>
              )}
            </div>

            {/* Step 7: Payment Selection */}
            <div className={cn(
              "border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300",
              step === 7 ? "border-primary ring-4 ring-primary/5 shadow-2xl scale-[1.01]" : "bg-slate-50/50"
            )}>
              <div className={cn(
                "p-5 flex items-center gap-4",
                step === 7 ? "bg-slate-50 border-b border-slate-100" : ""
              )}>
                  <span className={cn(
                    "font-black text-lg h-9 w-9 rounded-full flex items-center justify-center transition-all",
                    step === 7 ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-slate-200 text-slate-600"
                  )}>7</span>
                  <h2 className="font-black text-xl text-slate-900 tracking-tight">Select Payment Method</h2>
              </div>
              {step === 7 && (
                <div className="p-8 bg-white space-y-8">
                   <div className="border-2 border-primary rounded-2xl p-6 bg-blue-50/30 relative">
                      <div className="absolute -top-3 left-6 bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Recommended</div>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-5">
                            <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
                               <Image
                                 src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg"
                                 alt="Razorpay"
                                 width={100}
                                 height={24}
                                 className="h-6 w-auto"
                               />
                            </div>
                            <div>
                               <p className="font-black text-base text-slate-900 tracking-tight">Secure Razorpay Gateway</p>
                               <p className="text-xs text-slate-500 font-medium">UPI, Cards, Netbanking, Wallets</p>
                            </div>
                         </div>
                         <div className="h-7 w-7 rounded-full border-[7px] border-primary bg-white shadow-inner" />
                      </div>
                   </div>

                   <div className="bg-slate-50 p-5 rounded-xl text-xs text-slate-500 leading-relaxed border border-slate-100 flex gap-3">
                      <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-500" />
                      <div>
                        <p className="font-bold text-slate-900 mb-1">Secure Checkout Guaranteed</p>
                        <p>Your transaction is secured with 256-bit SSL encryption. Mana Events does not store sensitive card details. Payment is held in secure escrow until vendor milestones are verified.</p>
                      </div>
                   </div>

                   <Button
                      className="w-full bg-primary hover:bg-blue-700 text-white font-black h-16 rounded-xl shadow-2xl shadow-primary/30 border-none text-xl transition-all hover:-translate-y-1"
                      onClick={handlePayment}
                      disabled={isSubmitting}
                   >
                     {isSubmitting ? (
                       <span className="flex items-center gap-2">
                         <RefreshCw className="h-6 w-6 animate-spin" /> Processing...
                       </span>
                     ) : `Pay ${formatCurrency(pricing.total)} Now`}
                   </Button>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Sticky Summary Sidebar */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
             <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-primary opacity-10"></div>
                <Button
                  className={cn(
                    "w-full bg-primary hover:bg-blue-700 text-white font-black h-14 mb-5 rounded-xl shadow-xl shadow-primary/20 border-none transition-all hover:-translate-y-1",
                    step === 7 ? "opacity-50 pointer-events-none" : ""
                  )}
                  onClick={() => {
                    if (step < 6) setStep(6);
                    else if (step === 6) setStep(7);
                  }}
                  disabled={step === 7 || (step === 1 && (!eventDetails.type || !eventDetails.name))}
                >
                  {step < 6 ? "Review Order Details" : "Proceed to Payment"}
                </Button>
                <p className="text-[11px] text-slate-500 text-center mb-8 leading-relaxed px-2 font-medium">
                  Confirm your event details and service location to finalize the order summary.
                </p>

                <div className="border-t border-slate-100 pt-6 space-y-4">
                   <h3 className="font-black text-sm text-slate-900 uppercase tracking-widest">Order Summary</h3>
                   <div className="flex justify-between text-sm text-slate-600 font-medium">
                      <span>Base Service:</span>
                      <span className="text-slate-900">{formatCurrency(pricing.breakdown?.base || pricing.subtotal)}</span>
                   </div>
                   {pricing.breakdown && pricing.breakdown.guests > 0 && (
                     <div className="flex justify-between text-sm text-slate-600 font-medium">
                        <span>Guest Scaling:</span>
                        <span className="text-slate-900">{formatCurrency(pricing.breakdown.guests)}</span>
                     </div>
                   )}
                   <div className="flex justify-between text-sm text-slate-600 font-medium">
                      <span>Platform Fees ({BUSINESS_CONFIG.PLATFORM_FEE_PERCENTAGE}%):</span>
                      <span className="text-slate-900">{formatCurrency(calculatePlatformFee(pricing.subtotal))}</span>
                   </div>
                   <div className="flex justify-between text-sm text-slate-600 font-medium pb-2">
                      <span>Estimated GST ({BUSINESS_CONFIG.GST_PERCENTAGE}%):</span>
                      <span className="text-slate-900">{formatCurrency(calculateGST(pricing.subtotal))}</span>
                   </div>
                </div>

                <div className="border-t border-slate-200 mt-6 pt-6 flex justify-between items-center">
                   <span className="text-xl font-black text-slate-900 tracking-tight">Order Total:</span>
                   <span className="text-2xl font-black text-primary">{formatCurrency(pricing.total)}</span>
                </div>

                <div className="mt-8 pt-5 border-t border-slate-100">
                   <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest cursor-pointer hover:underline">
                      <Info className="h-3 w-3" /> How are fees calculated?
                   </div>
                </div>
             </div>

             <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
                <div className="flex items-start gap-4">
                   <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                   </div>
                   <div className="text-[11px] text-slate-600 leading-relaxed">
                      <span className="font-black text-slate-900 block mb-1 uppercase tracking-widest">Mana Escrow Protection</span>
                      Your funds are held securely and only released to the vendor once service milestones are confirmed.
                   </div>
                </div>
                <div className="flex items-start gap-4">
                   <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                   </div>
                   <div className="text-[11px] text-slate-600 leading-relaxed">
                      <span className="font-black text-slate-900 block mb-1 uppercase tracking-widest">Verified Professionals</span>
                      All vendors undergo a rigorous 3-step verification process including background checks and portfolio audits.
                   </div>
                </div>
             </div>
          </div>

        </div>
      </main>

      <footer className="border-t border-gray-200 py-10 bg-gray-50">
         <div className="max-w-[1200px] mx-auto px-4 text-[11px] text-gray-500 text-center space-y-2">
            <p>Condition of Use | Privacy Notice | Help</p>
            <p>© 2024, ManaEvents.in, Inc. or its affiliates</p>
         </div>
      </footer>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
