"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Package,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock3,
  RefreshCcw,
  Truck,
  Building2,
  Download,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Lock,
  Share2,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { customerService } from "@/services/client";
import { vendorService } from "@/services/client";
import { toast } from "react-hot-toast";
import { useCallback } from "react";

export default function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [trackingLocation, setTrackingLocation] = useState<any>(null);

  const requestPhoneOtp = async () => {
    try {
      await customerService.requestPhoneOtp(resolvedParams.id);
      toast.success("OTP sent successfully!");
    } catch {
      toast.error("Failed to send OTP. Please try again.");
    }
  };

  const verifyPhoneOtp = async (otp: string) => {
    try {
      await customerService.verifyPhoneOtp(resolvedParams.id, otp);
      toast.success("Phone verified successfully!");
      fetchBookingDetails();
    } catch {
      toast.error("Invalid OTP. Please try again.");
    }
  };

  const fetchBookingDetails = useCallback(async () => {
    try {
      const data = await customerService.getBookingById(resolvedParams.id);
      setBooking(data);
    } catch {
      // Error logged or handled by service
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchBookingDetails();
  }, [fetchBookingDetails]);

  useEffect(() => {
    if (booking?.status === "VENDOR_TRAVELING") {
      const interval = setInterval(async () => {
        try {
          const location = await vendorService.getBookingLocation(resolvedParams.id);
          setTrackingLocation(location);
        } catch { }
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [booking?.status, resolvedParams.id]);

  const handleShare = async () => {
    const shareData = {
      title: `Booking for ${booking.vendorprofile?.businessName || 'Partner'}`,
      text: `Check out my event booking #${booking.bookingNumber} at Mana Events!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const handleRebook = async () => {
    try {
      // Logic to add the same items to cart and redirect to checkout
      for (const item of booking.bookingitem) {
        await customerService.addToCart({
          serviceId: item.serviceId,
          packageId: item.packageId,
          quantity: item.quantity
        });
      }
      router.push('/customer/cart');
      toast.success("Items added to cart for rebooking!");
    } catch {
      toast.error("Failed to rebook. Some services might be unavailable.");
    }
  };

  if (loading) return <div className="p-8"><Skeleton className="h-96 w-full rounded-2xl" /></div>;
  if (!booking) return <div className="p-8 text-center">Booking not found</div>;

  const steps = [
    { label: "Booked", status: "COMPLETED", date: booking.createdAt, icon: Package },
    { label: "Confirmed", status: ["CONFIRMED", "VENDOR_ASSIGNED", "VENDOR_TRAVELING", "VENDOR_ARRIVED", "OTP_VERIFICATION_PENDING", "EVENT_STARTED", "EVENT_ONGOING", "EVENT_COMPLETED"].includes(booking.status) ? "COMPLETED" : "PENDING", icon: CheckCircle2 },
    { label: "In Transit", status: ["VENDOR_TRAVELING", "VENDOR_ARRIVED", "OTP_VERIFICATION_PENDING", "EVENT_STARTED", "EVENT_ONGOING", "EVENT_COMPLETED"].includes(booking.status) ? "COMPLETED" : "PENDING", icon: Truck },
    { label: "Arrived", status: ["VENDOR_ARRIVED", "OTP_VERIFICATION_PENDING", "EVENT_STARTED", "EVENT_ONGOING", "EVENT_COMPLETED"].includes(booking.status) ? "COMPLETED" : "PENDING", icon: MapPin },
    { label: "Event Started", status: ["EVENT_STARTED", "EVENT_ONGOING", "EVENT_COMPLETED"].includes(booking.status) ? "COMPLETED" : "PENDING", icon: Clock3 },
    { label: "Completed", status: booking.status === "EVENT_COMPLETED" ? "COMPLETED" : "PENDING", icon: RefreshCcw },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-5">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-12 w-12 hover:bg-slate-100 transition-colors border border-slate-200">
            <ArrowLeft className="h-5 w-5 text-slate-900" />
          </Button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Booking Details</h1>
            <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest flex items-center gap-2">
              Order #{booking.bookingNumber} <span className="h-1 w-1 rounded-full bg-slate-300"></span> Placed {format(new Date(booking.createdAt), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
           {trackingLocation && (
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-4 py-2 font-black rounded-xl shadow-sm">
                <MapPin className="h-4 w-4 mr-2" /> Vendor Live
              </Badge>
           )}
           {booking.status === "EVENT_COMPLETED" && (
              <Button
                variant="outline"
                className="rounded-xl border-slate-200 font-black h-12 px-6 gap-2 hover:bg-slate-50 transition-all shadow-sm"
                onClick={() => window.open(`/api/invoices/${booking.id}/download`, '_blank')}
              >
                <Download className="h-4 w-4" /> Download Invoice
              </Button>
           )}
           {booking.status === "EVENT_COMPLETED" && (
              <Button
                onClick={handleRebook}
                className="bg-primary hover:bg-blue-700 text-white rounded-xl font-black h-12 px-8 shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 gap-2"
              >
                <RefreshCcw className="h-4 w-4" /> Rebook Now
              </Button>
           )}
           {booking.status !== "EVENT_COMPLETED" && (
              <Button className="bg-primary hover:bg-blue-700 text-white rounded-xl font-black h-12 px-8 shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5">
                Track Live Status
              </Button>
           )}
           <Button
              variant="outline"
              size="icon"
              className="rounded-xl h-12 w-12 border-slate-200 shadow-sm"
              onClick={() => window.print()}
            >
              <Printer className="h-5 w-5 text-slate-600" />
           </Button>
           <Button
              variant="outline"
              size="icon"
              className="rounded-xl h-12 w-12 border-slate-200 shadow-sm"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5 text-slate-600" />
           </Button>
        </div>
      </div>

      {/* Timeline (Amazon/Delivery Style) */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50">
         <div className="relative flex justify-between max-w-5xl mx-auto">
            {/* Connection Line */}
            <div className="absolute top-6 left-10 right-10 h-[2px] bg-slate-100 -z-0" />

            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = step.status === "COMPLETED";
              return (
                <div key={idx} className="relative z-10 flex flex-col items-center gap-4 text-center group">
                   <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center border-4 border-white transition-all duration-500 shadow-xl",
                      isCompleted ? "bg-primary text-white scale-110" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                   )}>
                      <Icon className={cn("h-6 w-6", isCompleted ? "animate-pulse" : "")} />
                   </div>
                   <div className="space-y-1">
                      <p className={cn("text-[10px] font-black uppercase tracking-widest", isCompleted ? "text-slate-900" : "text-slate-400")}>{step.label}</p>
                      {step.date && <p className="text-[11px] font-bold text-slate-400">{format(new Date(step.date), 'hh:mm a')}</p>}
                   </div>
                </div>
              );
            })}
         </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
         {/* Left Column: Details */}
         <div className="lg:col-span-8 space-y-10">
            <section className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
               <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-black text-slate-900 flex items-center gap-3 uppercase tracking-widest text-xs">
                     <Building2 className="h-5 w-5 text-primary" /> Vendor Profile
                  </h3>
                  {booking.vendorprofile && (
                    <Link href={`/marketplace/vendor/${booking.vendorprofile.id}`} className="text-xs font-black text-primary uppercase hover:underline tracking-widest">
                      View Business Profile
                    </Link>
                  )}
               </div>
               <div className="p-8 flex flex-col sm:flex-row gap-8">
                  <div className="h-28 w-28 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-inner overflow-hidden relative">
                     {booking.vendorprofile?.logo ? (
                        <Image
                          src={booking.vendorprofile.logo}
                          alt={booking.vendorprofile.businessName}
                          fill
                          className="object-cover"
                        />
                     ) : (
                        <div className="text-3xl font-black text-slate-200">{booking.vendorprofile?.businessName?.[0] || 'V'}</div>
                     )}
                  </div>
                  <div className="flex-1">
                     {!booking.customerPhoneVerified && (
                        <div className="mb-6 bg-amber-50 p-5 rounded-2xl border border-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                           <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Verification Required</p>
                                 <Button variant="link" className="p-0 h-auto text-xs text-amber-600 font-black" onClick={requestPhoneOtp}>Request SMS OTP</Button>
                              </div>
                           </div>
                           <input
                              placeholder="000000"
                              maxLength={6}
                              className="w-full sm:w-32 bg-white border border-amber-200 rounded-xl px-4 py-3 text-center font-black text-lg tracking-[0.2em] focus:ring-2 focus:ring-amber-200 outline-none shadow-sm"
                              onChange={(e) => { if(e.target.value.length === 6) verifyPhoneOtp(e.target.value); }}
                           />
                        </div>
                     )}
                     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                        <h4 className="text-2xl font-black text-slate-900 tracking-tight">{booking.vendorprofile?.businessName || 'Partner'}</h4>
                        <div className="flex gap-3">
                           <Button variant="outline" className="rounded-xl h-12 w-12 p-0 border-slate-200 hover:bg-slate-50 shadow-sm">
                              <Phone className="h-5 w-5 text-slate-600" />
                           </Button>
                           <Button variant="outline" className="rounded-xl h-12 w-12 p-0 border-slate-200 hover:bg-slate-50 shadow-sm">
                              <MessageSquare className="h-5 w-5 text-slate-600" />
                           </Button>
                        </div>
                     </div>
                     <p className="text-base text-slate-500 font-medium leading-relaxed max-w-2xl">{booking.vendorprofile?.description}</p>
                     <div className="flex items-center gap-4 mt-6">
                        <Badge className="rounded-lg text-[10px] font-black tracking-widest px-3 py-1.5 bg-indigo-50 text-indigo-700 border-none shadow-sm uppercase">Premium Partner</Badge>
                        <Badge className="rounded-lg text-[10px] font-black tracking-widest px-3 py-1.5 bg-emerald-50 text-emerald-700 border-none shadow-sm uppercase">Verified</Badge>
                     </div>
                  </div>
               </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
               <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Included Services</h3>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded border border-slate-100 shadow-sm">Quantity: {booking.bookingitem.length}</span>
               </div>
               <div className="divide-y divide-slate-100">
                  {booking.bookingitem.map((item: any, i: number) => (
                     <div key={i} className="p-8 flex justify-between items-center group hover:bg-slate-50/30 transition-colors">
                        <div className="flex gap-6">
                           <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0 border border-primary/10 group-hover:scale-105 transition-transform">
                              <Package className="h-8 w-8" />
                           </div>
                           <div className="space-y-1">
                              <p className="font-black text-lg text-slate-900 tracking-tight">{item.service.title}</p>
                              {item.Renamedpackage && (
                                 <p className="text-sm text-slate-500 font-medium">Plan: <span className="text-slate-900 font-bold">{item.Renamedpackage.name}</span></p>
                              )}
                              <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-2 bg-blue-50 inline-block px-2 py-0.5 rounded">Unit Price: ₹{Number(item.price).toLocaleString()}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="font-black text-2xl text-slate-900">₹{Number(item.price * item.quantity).toLocaleString()}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Qty: {item.quantity}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </section>
         </div>

         {/* Right Column: Event & Payment */}
         <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Sparkles className="h-20 w-20 text-white" />
               </div>
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-8">Event Logistics</h3>
               <div className="space-y-8">
                  <div className="flex gap-5 items-start">
                     <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                        <Calendar className="h-6 w-6 text-primary" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Schedule Date</p>
                        <p className="text-lg font-black tracking-tight">{format(new Date(booking.eventDate), 'MMMM dd, yyyy')}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">{format(new Date(booking.eventDate), 'EEEE')}</p>
                     </div>
                  </div>
                  <div className="flex gap-5 items-start">
                     <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                        <Clock className="h-6 w-6 text-primary" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Window</p>
                        <p className="text-lg font-black tracking-tight">{booking.eventTime || '06:00 PM onwards'}</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">Standard Evening Slot</p>
                     </div>
                  </div>
                  <div className="flex gap-5 items-start">
                     <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                        <MapPin className="h-6 w-6 text-primary" />
                     </div>
                     <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Service Destination</p>
                        <p className="text-sm font-bold leading-relaxed text-slate-200">{booking.eventLocation}</p>
                        <p className="text-[10px] font-black text-primary mt-2 uppercase tracking-tighter hover:underline cursor-pointer">Open in Google Maps →</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-primary opacity-10"></div>
               <h3 className="font-black text-slate-900 mb-8 uppercase tracking-widest text-xs">Financial Summary</h3>
               <div className="space-y-5">
                  <div className="flex justify-between text-sm font-medium">
                     <span className="text-slate-500">Service Subtotal</span>
                     <span className="font-black text-slate-900">₹{Number(booking.subTotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                     <span className="text-slate-500">Platform Convenience Fee</span>
                     <span className="font-black text-slate-900">₹{Number(booking.commissionAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                     <span className="text-slate-500">Taxes & GST (18%)</span>
                     <span className="font-black text-slate-900">₹{Number(booking.taxAmount).toLocaleString()}</span>
                  </div>
                  {Number(booking.discountAmount) > 0 && (
                     <div className="flex justify-between text-sm text-emerald-600 font-black bg-emerald-50 p-3 rounded-xl">
                        <span>Promotional Discount</span>
                        <span>-₹{Number(booking.discountAmount).toLocaleString()}</span>
                     </div>
                  )}
                  <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                     <span className="font-black text-slate-900 tracking-tight">Total Transaction</span>
                     <span className="text-3xl font-black text-primary">₹{Number(booking.totalAmount).toLocaleString()}</span>
                  </div>
               </div>

               {booking.status === "OTP_VERIFICATION_PENDING" && (
                 <div className="mt-10 p-6 bg-primary rounded-2xl flex items-center gap-5 shadow-2xl shadow-primary/30 relative overflow-hidden group">
                    <div className="absolute -right-5 -bottom-5 opacity-20 group-hover:scale-110 transition-transform">
                       <Lock className="h-20 w-20 text-white" />
                    </div>
                    <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                       <AlertCircle className="h-8 w-8 text-white" />
                    </div>
                    <div className="relative z-10">
                       <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Service Verification OTP</p>
                       <p className="text-3xl font-black tracking-[0.3em] text-white">{booking.otp || '----'}</p>
                    </div>
                 </div>
               )}
            </div>

            <div className="space-y-4">
               <Button variant="outline" className="w-full rounded-2xl h-14 border-slate-200 font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" /> Need Assistance?
               </Button>
               <Button variant="ghost" className="w-full rounded-2xl h-14 text-rose-600 hover:bg-rose-50 font-black transition-all">
                  Cancel Booking Request
               </Button>
            </div>
         </div>
      </div>
    </div>
  );
}
