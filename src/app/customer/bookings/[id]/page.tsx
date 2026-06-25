"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Package,
  User,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock3,
  RefreshCcw,
  Truck,
  Building2,
  MoreVertical,
  Download,
  AlertCircle,
  HelpCircle,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingDetails();
  }, [resolvedParams.id]);

  const fetchBookingDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/customer/bookings/${resolvedParams.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBooking(data);
      }
    } catch (error) {
      console.error("Failed to fetch booking details", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8"><Skeleton className="h-96 w-full rounded-2xl" /></div>;
  if (!booking) return <div className="p-8 text-center">Booking not found</div>;

  const steps = [
    { label: "Booked", status: "COMPLETED", date: booking.createdAt, icon: Package },
    { label: "Confirmed", status: ["CONFIRMED", "VENDOR_ASSIGNED", "VENDOR_TRAVELING", "VENDOR_ARRIVED", "EVENT_STARTED", "EVENT_ONGOING", "EVENT_COMPLETED"].includes(booking.status) ? "COMPLETED" : "PENDING", icon: CheckCircle2 },
    { label: "In Transit", status: ["VENDOR_TRAVELING", "VENDOR_ARRIVED", "EVENT_STARTED", "EVENT_ONGOING", "EVENT_COMPLETED"].includes(booking.status) ? "COMPLETED" : "PENDING", icon: Truck },
    { label: "Event Started", status: ["EVENT_STARTED", "EVENT_ONGOING", "EVENT_COMPLETED"].includes(booking.status) ? "COMPLETED" : "PENDING", icon: Clock3 },
    { label: "Completed", status: booking.status === "EVENT_COMPLETED" ? "COMPLETED" : "PENDING", icon: RefreshCcw },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
            <p className="text-sm text-gray-500">Order # {booking.bookingNumber} • Placed {format(new Date(booking.createdAt), 'MMM dd, yyyy')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="rounded-xl border-gray-200 font-bold gap-2">
             <Download className="h-4 w-4" /> Invoice
           </Button>
           <Button className="bg-purple-600 hover:bg-purple-700 rounded-xl font-bold">
             Track Vendor
           </Button>
        </div>
      </div>

      {/* Timeline (Amazon/Delivery Style) */}
      <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
         <div className="relative flex justify-between">
            {/* Connection Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-100 -z-0" />

            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = step.status === "COMPLETED";
              return (
                <div key={idx} className="relative z-10 flex flex-col items-center gap-3 text-center">
                   <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center border-4 border-white transition-all duration-500 shadow-md",
                      isCompleted ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-400"
                   )}>
                      <Icon className="h-4 w-4" />
                   </div>
                   <div>
                      <p className={cn("text-xs font-black uppercase tracking-tighter", isCompleted ? "text-gray-900" : "text-gray-400")}>{step.label}</p>
                      {step.date && <p className="text-[10px] text-gray-400 mt-0.5">{format(new Date(step.date), 'hh:mm a')}</p>}
                   </div>
                </div>
              );
            })}
         </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
         {/* Left Column: Details */}
         <div className="lg:col-span-8 space-y-8">
            <section className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
               <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                     <Building2 className="h-5 w-5 text-purple-600" /> Vendor Information
                  </h3>
                  <Link href={`/marketplace/vendor/${booking.vendorprofile.id}`} className="text-xs font-black text-purple-600 uppercase hover:underline">
                    View Profile
                  </Link>
               </div>
               <div className="p-6 flex gap-6">
                  <div className="h-20 w-20 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                     {booking.vendorprofile.logo ? (
                        <img src={booking.vendorprofile.logo} className="h-full w-full object-cover rounded-2xl" />
                     ) : (
                        <User className="h-10 w-10 text-gray-200" />
                     )}
                  </div>
                  <div className="flex-1">
                     <div className="flex items-center justify-between">
                        <h4 className="text-xl font-black text-gray-900">{booking.vendorprofile.businessName}</h4>
                        <div className="flex gap-2">
                           <Button size="sm" variant="outline" className="rounded-xl h-9 w-9 p-0 border-gray-200">
                              <Phone className="h-4 w-4 text-gray-600" />
                           </Button>
                           <Button size="sm" variant="outline" className="rounded-xl h-9 w-9 p-0 border-gray-200">
                              <MessageSquare className="h-4 w-4 text-gray-600" />
                           </Button>
                        </div>
                     </div>
                     <p className="text-sm text-gray-500 mt-1 max-w-md">{booking.vendorprofile.description}</p>
                     <div className="flex items-center gap-4 mt-4">
                        <Badge variant="outline" className="rounded-full text-[10px] font-bold border-purple-100 text-purple-600">PREMIUM PARTNER</Badge>
                        <Badge variant="outline" className="rounded-full text-[10px] font-bold border-blue-100 text-blue-600">VERIFIED</Badge>
                     </div>
                  </div>
               </div>
            </section>

            <section className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
               <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">Event Services</h3>
                  <span className="text-xs font-bold text-gray-400">Items: {booking.bookingitem.length}</span>
               </div>
               <div className="divide-y divide-gray-50">
                  {booking.bookingitem.map((item: any, i: number) => (
                     <div key={i} className="p-6 flex justify-between items-center group">
                        <div className="flex gap-4">
                           <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                              <Package className="h-6 w-6" />
                           </div>
                           <div>
                              <p className="font-bold text-gray-900">{item.service.title}</p>
                              {item.Renamedpackage && (
                                 <p className="text-xs text-gray-500">Package: {item.Renamedpackage.name}</p>
                              )}
                              <p className="text-[10px] font-bold text-purple-600 uppercase mt-1">Qty: {item.quantity}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="font-black text-gray-900">₹{Number(item.price).toLocaleString()}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </section>
         </div>

         {/* Right Column: Event & Payment */}
         <div className="lg:col-span-4 space-y-6">
            <div className="bg-gray-900 text-white rounded-3xl p-6 shadow-xl shadow-purple-100">
               <h3 className="text-sm font-black uppercase tracking-widest text-purple-300 mb-6">Event Details</h3>
               <div className="space-y-6">
                  <div className="flex gap-4">
                     <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <Calendar className="h-5 w-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Event Date</p>
                        <p className="font-bold">{format(new Date(booking.eventDate), 'MMMM dd, yyyy')}</p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <Clock className="h-5 w-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Time & Duration</p>
                        <p className="font-bold">{booking.eventTime || '06:00 PM onwards'}</p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Event Location</p>
                        <p className="font-bold text-sm leading-relaxed">{booking.eventLocation}</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
               <h3 className="font-bold text-gray-900 mb-6">Payment Summary</h3>
               <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                     <span className="text-gray-500">Subtotal</span>
                     <span className="font-bold text-gray-900">₹{Number(booking.subTotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="text-gray-500">Service Fee</span>
                     <span className="font-bold text-gray-900">₹{Number(booking.commissionAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="text-gray-500">GST (18%)</span>
                     <span className="font-bold text-gray-900">₹{Number(booking.taxAmount).toLocaleString()}</span>
                  </div>
                  {Number(booking.discountAmount) > 0 && (
                     <div className="flex justify-between text-sm text-green-600 font-bold">
                        <span>Discount</span>
                        <span>-₹{Number(booking.discountAmount).toLocaleString()}</span>
                     </div>
                  )}
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                     <span className="font-black text-gray-900">Total Paid</span>
                     <span className="text-xl font-black text-purple-600">₹{Number(booking.totalAmount).toLocaleString()}</span>
                  </div>
               </div>

               <div className="mt-8 p-4 bg-purple-50 rounded-2xl flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
                     <AlertCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-purple-600 uppercase">OTP for verification</p>
                     <p className="text-lg font-black tracking-widest text-purple-900">{booking.otp || '----'}</p>
                  </div>
               </div>
            </div>

            <div className="space-y-3">
               <Button variant="outline" className="w-full rounded-2xl h-12 border-gray-200 font-bold text-gray-600">
                  <HelpCircle className="h-4 w-4 mr-2" /> Need help with this booking?
               </Button>
               <Button variant="ghost" className="w-full rounded-2xl h-12 text-rose-600 hover:bg-rose-50 font-bold">
                  Cancel Booking
               </Button>
            </div>
         </div>
      </div>
    </div>
  );
}
