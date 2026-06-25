"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCheckoutStore, CheckoutStep, PLATFORM_FEE_PERCENT, TAX_PERCENT } from "@/store/checkoutStore";
import Navbar from "@/components/common/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, accessToken } = useAuthStore();
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
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [isOrderSummaryExpanded, setIsOrderSummaryExpanded] = useState(false);

  // Initialize checkout with vendor info
  useEffect(() => {
    const vendorId = searchParams?.get("vendorId");
    const serviceId = searchParams?.get("serviceId");
    const packageId = searchParams?.get("packageId");

    if (vendorId && serviceId && !vendorInfo.vendorId) {
      const fetchVendorData = async () => {
        try {
          const res = await axios.get(`/api/marketplace/${vendorId}`);
          const vendor = res.data.vendor;
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
        } catch (error) {
          toast({ variant: "destructive", title: "Error", description: "Failed to load vendor information." });
        }
      };
      fetchVendorData();
    }
  }, [searchParams]);

  const validateAvailability = async () => {
    setIsValidating(true);
    setAvailabilityError(null);
    try {
      const res = await axios.post("/api/vendor/availability/check", {
        vendorId: vendorInfo.vendorId,
        date: dateTime.date,
      });

      if (res.data.available) {
        setStep(6);
      } else {
        setAvailabilityError(res.data.reason || "Vendor is not available on this date.");
      }
    } catch (error) {
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
    const razorpayLoaded = await loadRazorpay();
    if (!razorpayLoaded) {
      toast({ variant: "destructive", title: "Error", description: "Razorpay SDK failed to load." });
      return;
    }

    try {
      const bookingRes = await axios.post("/api/bookings", {
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
        items: [{
          serviceId: vendorInfo.serviceId,
          packageId: vendorInfo.packageId,
          price: vendorInfo.basePrice,
        }]
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const booking = bookingRes.data;

      const orderRes = await axios.post("/api/checkout/razorpay", {
        amount: pricing.total,
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderRes.data.amount,
        currency: orderRes.data.currency,
        name: "Mana Events",
        description: `Booking ID: ${booking.bookingNumber}`,
        order_id: orderRes.data.id,
        handler: async (response: any) => {
          try {
            await axios.post("/api/checkout/razorpay/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking.id,
            }, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });

            resetCheckout();
            router.push(`/customer/orders/success?bookingId=${booking.id}`);
          } catch (err) {
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
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: error.response?.data?.message || "Failed to initiate payment."
      });
    }
  };

  const getStepStatus = (stepId: number) => {
    if (step === stepId) return "active";
    if (step > stepId) return "completed";
    return "pending";
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Checkout Header (Simple) */}
      <header className="border-b border-gray-200 bg-white py-4 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 flex justify-between items-center">
          <Link href="/">
             <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-baseline">
               mana<span className="text-primary">Events</span>
             </h1>
          </Link>
          <div className="flex items-center gap-2 text-xl font-bold text-slate-700">
             Checkout <span className="text-slate-400 font-normal text-sm">({step}/7)</span>
          </div>
          <div className="flex items-center text-slate-400">
             <Lock className="h-5 w-5" />
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Multi-step accordions */}
          <div className="lg:col-span-8 space-y-4">

            {/* Step 1: Event Details */}
            <div className={cn(
              "border border-slate-200 rounded-lg overflow-hidden transition-all",
              step === 1 ? "border-primary ring-1 ring-primary/20 shadow-lg" : "bg-slate-50/50"
            )}>
              <div className={cn(
                "p-4 flex justify-between items-center",
                step === 1 ? "bg-slate-50 border-b border-slate-100" : ""
              )}>
                <div className="flex gap-4 items-center">
                  <span className={cn(
                    "font-bold text-lg h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                    step === 1 ? "bg-primary text-white" : "bg-slate-200 text-slate-600"
                  )}>1</span>
                  <h2 className="font-bold text-lg text-slate-900">Event Details</h2>
                </div>
                {step > 1 && (
                  <button onClick={() => setStep(1)} className="text-primary text-sm font-semibold hover:underline">Change</button>
                )}
              </div>
              {step === 1 && (
                <div className="p-6 bg-white space-y-4">
                   <div className="space-y-4 max-w-md">
                      <div className="space-y-1">
                        <Label className="text-sm font-bold">Event Type</Label>
                        <Input
                          placeholder="e.g. Wedding, Birthday"
                          value={eventDetails.type}
                          className="h-9"
                          onChange={e => setEventDetails({...eventDetails, type: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-bold">Event Name</Label>
                        <Input
                          placeholder="Give your event a name"
                          value={eventDetails.name}
                          className="h-9"
                          onChange={e => setEventDetails({...eventDetails, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-bold">Description (Optional)</Label>
                        <Textarea
                          placeholder="Brief description"
                          value={eventDetails.description}
                          className="min-h-[80px]"
                          onChange={e => setEventDetails({...eventDetails, description: e.target.value})}
                        />
                      </div>
                      <Button
                        className="bg-primary hover:bg-blue-700 text-white font-bold h-10 px-6 rounded-md shadow-md border-none"
                        onClick={() => setStep(2)}
                        disabled={!eventDetails.type || !eventDetails.name}
                      >
                        Use this event details
                      </Button>
                   </div>
                </div>
              )}
            </div>

            {/* Step 2: Guest Information */}
            <div className={cn(
              "border border-slate-200 rounded-lg overflow-hidden transition-all",
              step === 2 ? "border-primary ring-1 ring-primary/20 shadow-lg" : "bg-slate-50/50"
            )}>
              <div className={cn(
                "p-4 flex justify-between items-center",
                step === 2 ? "bg-slate-50 border-b border-slate-100" : ""
              )}>
                <div className="flex gap-4 items-center">
                  <span className={cn(
                    "font-bold text-lg h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                    step === 2 ? "bg-primary text-white" : "bg-slate-200 text-slate-600"
                  )}>2</span>
                  <h2 className="font-bold text-lg text-slate-900">Guest Information</h2>
                </div>
                {step > 2 && (
                  <button onClick={() => setStep(2)} className="text-primary text-sm font-semibold hover:underline">Change</button>
                )}
              </div>
              {step === 2 && (
                <div className="p-6 bg-white space-y-4">
                   <div className="space-y-4 max-w-md">
                      <div className="space-y-1">
                        <Label className="text-sm font-bold text-slate-700">Estimated Guest Count</Label>
                        <Input
                          type="number"
                          value={guestInfo.count}
                          className="h-10 border-slate-200 focus:border-primary"
                          onChange={e => setGuestInfo({...guestInfo, count: parseInt(e.target.value) || 0})}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-bold text-slate-700">Special Instructions</Label>
                        <Textarea
                          placeholder="Any specific requests?"
                          value={guestInfo.requirements}
                          className="border-slate-200 focus:border-primary"
                          onChange={e => setGuestInfo({...guestInfo, requirements: e.target.value})}
                        />
                      </div>
                      <Button
                        className="bg-primary hover:bg-blue-700 text-white font-bold h-10 px-6 rounded-md shadow-md border-none"
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
              "border border-slate-200 rounded-lg overflow-hidden transition-all",
              step === 3 ? "border-primary ring-1 ring-primary/20 shadow-lg" : "bg-slate-50/50"
            )}>
              <div className={cn(
                "p-4 flex justify-between items-center",
                step === 3 ? "bg-slate-50 border-b border-slate-100" : ""
              )}>
                <div className="flex gap-4 items-center">
                  <span className={cn(
                    "font-bold text-lg h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                    step === 3 ? "bg-primary text-white" : "bg-slate-200 text-slate-600"
                  )}>3</span>
                  <h2 className="font-bold text-lg text-slate-900">Date & Time</h2>
                </div>
                {step > 3 && (
                  <button onClick={() => setStep(3)} className="text-primary text-sm font-semibold hover:underline">Change</button>
                )}
              </div>
              {step === 3 && (
                <div className="p-6 bg-white space-y-4">
                   <div className="grid grid-cols-2 gap-4 max-w-md">
                      <div className="space-y-1">
                        <Label className="text-sm font-bold text-slate-700">Date</Label>
                        <Input
                          type="date"
                          className="h-10 border-slate-200 focus:border-primary"
                          value={dateTime.date}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => setDateTime({...dateTime, date: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-bold text-slate-700">Time</Label>
                        <Input
                          type="time"
                          className="h-10 border-slate-200 focus:border-primary"
                          value={dateTime.time}
                          onChange={e => setDateTime({...dateTime, time: e.target.value})}
                        />
                      </div>
                   </div>
                   <Button
                      className="bg-primary hover:bg-blue-700 text-white font-bold h-10 px-6 rounded-md shadow-md border-none"
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
              "border border-slate-200 rounded-lg overflow-hidden transition-all",
              step === 4 ? "border-primary ring-1 ring-primary/20 shadow-lg" : "bg-slate-50/50"
            )}>
              <div className={cn(
                "p-4 flex justify-between items-center",
                step === 4 ? "bg-slate-50 border-b border-slate-100" : ""
              )}>
                <div className="flex gap-4 items-center">
                  <span className={cn(
                    "font-bold text-lg h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                    step === 4 ? "bg-primary text-white" : "bg-slate-200 text-slate-600"
                  )}>4</span>
                  <h2 className="font-bold text-lg text-slate-900">Location Details</h2>
                </div>
                {step > 4 && (
                  <button onClick={() => setStep(4)} className="text-primary text-sm font-semibold hover:underline">Change</button>
                )}
              </div>
              {step === 4 && (
                <div className="p-6 bg-white space-y-4">
                   <div className="space-y-4 max-w-lg">
                      <div className="space-y-1">
                        <Label className="text-sm font-bold text-slate-700">Address</Label>
                        <Input
                          placeholder="Street address, building, etc."
                          value={location.address}
                          className="h-10 border-slate-200 focus:border-primary"
                          onChange={e => setLocation({...location, address: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-sm font-bold text-slate-700">Landmark</Label>
                          <Input value={location.landmark} className="h-10 border-slate-200 focus:border-primary" onChange={e => setLocation({...location, landmark: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm font-bold text-slate-700">City</Label>
                          <Input value={location.city} className="h-10 border-slate-200 focus:border-primary" onChange={e => setLocation({...location, city: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm font-bold text-slate-700">State</Label>
                          <Input value={location.state} className="h-10 border-slate-200 focus:border-primary" onChange={e => setLocation({...location, state: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm font-bold text-slate-700">Pincode</Label>
                          <Input maxLength={6} value={location.pincode} className="h-10 border-slate-200 focus:border-primary" onChange={e => setLocation({...location, pincode: e.target.value})} />
                        </div>
                      </div>
                      <Button
                        className="bg-primary hover:bg-blue-700 text-white font-bold h-10 px-6 rounded-md shadow-md border-none"
                        onClick={() => setStep(5)}
                        disabled={!location.address || !location.city || !location.pincode}
                      >
                        Deliver service here
                      </Button>
                   </div>
                </div>
              )}
            </div>

            {/* Step 5: Vendor Check */}
            <div className={cn(
              "border border-slate-200 rounded-lg overflow-hidden transition-all",
              step === 5 ? "border-primary ring-1 ring-primary/20 shadow-lg" : "bg-slate-50/50"
            )}>
              <div className={cn(
                "p-4 flex justify-between items-center",
                step === 5 ? "bg-slate-50 border-b border-slate-100" : ""
              )}>
                <div className="flex gap-4 items-center">
                  <span className={cn(
                    "font-bold text-lg h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                    step === 5 ? "bg-primary text-white" : "bg-slate-200 text-slate-600"
                  )}>5</span>
                  <h2 className="font-bold text-lg text-slate-900">Vendor Confirmation</h2>
                </div>
              </div>
              {step === 5 && (
                <div className="p-6 bg-white space-y-4 text-center py-10">
                   <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-700 font-bold text-2xl mb-4 border border-slate-200">
                      {vendorInfo.vendorName[0]}
                   </div>
                   <h3 className="font-bold text-xl text-slate-900">{vendorInfo.vendorName}</h3>
                   <p className="text-sm text-slate-600 max-w-sm mx-auto">
                     We'll check if {vendorInfo.vendorName} is available for your selected date: <span className="font-bold text-slate-900">{dateTime.date}</span>
                   </p>

                   {availabilityError && (
                      <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center justify-center gap-2 max-w-sm mx-auto mt-4">
                         <AlertCircle className="h-4 w-4" /> {availabilityError}
                      </div>
                   )}

                   <div className="pt-4">
                      <Button
                        className="bg-primary hover:bg-blue-700 text-white font-bold h-12 px-8 rounded-md shadow-lg border-none"
                        onClick={validateAvailability}
                        disabled={isValidating}
                      >
                        {isValidating ? "Validating..." : "Check Availability & Review"}
                      </Button>
                   </div>
                </div>
              )}
            </div>

            {/* Step 6: Final Review */}
            <div className={cn(
              "border border-slate-200 rounded-lg overflow-hidden transition-all",
              step === 6 ? "border-primary ring-1 ring-primary/20 shadow-lg" : "bg-slate-50/50"
            )}>
              <div className={cn(
                "p-4 flex justify-between items-center",
                step === 6 ? "bg-slate-50 border-b border-slate-100" : ""
              )}>
                <div className="flex gap-4 items-center">
                  <span className={cn(
                    "font-bold text-lg h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                    step === 6 ? "bg-primary text-white" : "bg-slate-200 text-slate-600"
                  )}>6</span>
                  <h2 className="font-bold text-lg text-slate-900">Review items and delivery</h2>
                </div>
              </div>
              {step === 6 && (
                <div className="p-6 bg-white space-y-6">
                   <div className="grid md:grid-cols-2 gap-8 text-sm">
                      <div className="space-y-4">
                         <div>
                           <h4 className="font-bold text-slate-900 mb-1">Service Address</h4>
                           <p className="text-slate-600 leading-relaxed">{location.address}, {location.landmark && `${location.landmark}, `}{location.city}, {location.state} - {location.pincode}</p>
                         </div>
                         <div>
                           <h4 className="font-bold text-slate-900 mb-1">Event Timing</h4>
                           <p className="text-slate-600 leading-relaxed">{new Date(dateTime.date).toDateString()} at {dateTime.time}</p>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <div>
                           <h4 className="font-bold text-slate-900 mb-1">Payment Method</h4>
                           <p className="text-slate-600 leading-relaxed">Select in next step</p>
                         </div>
                         <div>
                           <h4 className="font-bold text-slate-900 mb-1">Vendor Info</h4>
                           <p className="text-slate-900 font-bold">{vendorInfo.vendorName}</p>
                           <p className="text-slate-500 text-xs italic">{vendorInfo.packageName || "Selected Service"}</p>
                         </div>
                      </div>
                   </div>
                   <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                      <p className="text-xs text-slate-500 text-center md:text-left">By placing your order, you agree to Mana's <span className="text-primary font-bold cursor-pointer hover:underline">Terms & Conditions</span>.</p>
                      <Button
                        className="w-full md:w-auto bg-primary hover:bg-blue-700 text-white font-bold h-12 px-8 rounded-md shadow-lg border-none"
                        onClick={() => setStep(7)}
                      >
                        Place your order and pay
                      </Button>
                   </div>
                </div>
              )}
            </div>

            {/* Step 7: Payment Selection */}
            <div className={cn(
              "border border-slate-200 rounded-lg overflow-hidden transition-all",
              step === 7 ? "border-primary ring-1 ring-primary/20 shadow-lg" : "bg-slate-50/50"
            )}>
              <div className={cn(
                "p-4 flex items-center gap-4",
                step === 7 ? "bg-slate-50 border-b border-slate-100" : ""
              )}>
                  <span className={cn(
                    "font-bold text-lg h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                    step === 7 ? "bg-primary text-white" : "bg-slate-200 text-slate-600"
                  )}>7</span>
                  <h2 className="font-bold text-lg text-slate-900">Select a payment method</h2>
              </div>
              {step === 7 && (
                <div className="p-6 bg-white space-y-6">
                   <div className="border border-blue-100 rounded-xl p-5 bg-blue-50/30">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-white rounded-lg border border-blue-100 shadow-sm">
                               <img src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" alt="Razorpay" className="h-5" />
                            </div>
                            <div>
                               <p className="font-bold text-sm text-slate-900">Secure Razorpay Gateway</p>
                               <p className="text-xs text-slate-500">Cards, UPI, Netbanking, Wallets</p>
                            </div>
                         </div>
                         <div className="h-6 w-6 rounded-full border-[6px] border-primary bg-white shadow-inner" />
                      </div>
                   </div>

                   <div className="bg-slate-50 p-4 rounded-lg text-xs text-slate-500 leading-relaxed border border-slate-100">
                      <Lock className="h-3 w-3 inline-block mr-1 text-slate-400" /> Your transaction is secured with industry-standard encryption. Mana Events does not store your card details. Payment is held in escrow until vendor milestones are confirmed.
                   </div>

                   <Button
                      className="w-full bg-primary hover:bg-blue-700 text-white font-bold h-14 rounded-md shadow-xl border-none text-lg"
                      onClick={handlePayment}
                   >
                     Pay ₹{pricing.total.toLocaleString('en-IN')} Now
                   </Button>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Sticky Summary Sidebar */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
             <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xl">
                <Button
                  className={cn(
                    "w-full bg-primary hover:bg-blue-700 text-white font-bold h-12 mb-4 rounded-md shadow-lg border-none",
                    step === 7 ? "opacity-50" : ""
                  )}
                  onClick={() => {
                    if (step < 6) setStep(6);
                    else if (step === 6) setStep(7);
                  }}
                  disabled={step === 7 || (step === 1 && (!eventDetails.type || !eventDetails.name))}
                >
                  {step < 6 ? "Review Order" : "Continue to Payment"}
                </Button>
                <p className="text-[11px] text-slate-500 text-center mb-6 leading-relaxed px-2">
                  Choose a delivery address and payment method to calculate tax and service fees.
                </p>

                <div className="border-t border-slate-100 pt-5 space-y-3">
                   <h3 className="font-bold text-sm text-slate-900">Order Summary</h3>
                   <div className="flex justify-between text-xs text-slate-600">
                      <span>Items (1 Service):</span>
                      <span className="font-medium">₹{pricing.subtotal.toLocaleString('en-IN')}</span>
                   </div>
                   <div className="flex justify-between text-xs text-slate-600">
                      <span>Platform Fees (5%):</span>
                      <span className="font-medium">₹{pricing.platformFee.toLocaleString('en-IN')}</span>
                   </div>
                   <div className="flex justify-between text-xs text-slate-600">
                      <span>Estimated GST (18%):</span>
                      <span className="font-medium">₹{pricing.taxes.toLocaleString('en-IN')}</span>
                   </div>
                </div>

                <div className="border-t border-slate-200 mt-5 pt-5 flex justify-between items-center">
                   <span className="text-xl font-bold text-slate-900">Order Total:</span>
                   <span className="text-xl font-bold text-primary">₹{pricing.total.toLocaleString('en-IN')}</span>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                   <div className="flex items-center gap-2 text-primary text-xs font-bold cursor-pointer hover:underline">
                      <Info className="h-3 w-3" /> How are fees calculated?
                   </div>
                </div>
             </div>

             <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-5 shadow-sm">
                <div className="flex items-start gap-3">
                   <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                   <div className="text-[11px] text-slate-600 leading-relaxed">
                      <span className="font-bold text-slate-900 block mb-0.5 uppercase tracking-tighter">Mana Escrow Protection</span>
                      Your money is safe. We only release funds to the vendor once service milestones are confirmed.
                   </div>
                </div>
                <div className="flex items-start gap-3">
                   <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                   <div className="text-[11px] text-slate-600 leading-relaxed">
                      <span className="font-bold text-slate-900 block mb-0.5 uppercase tracking-tighter">Verified Vendors</span>
                      All vendors on Mana go through a strict 3-step verification process including background checks.
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
