"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  FileText,
  Download,
  Share2,
  MessageSquare,
  Home,
  Store,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { customerService } from "@/services/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { EventSummary } from "@/components/booking/EventSummary";
import { BookingProgress } from "@/components/booking/BookingProgress";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("orderId");
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (orderId) {
      customerService.getBookingById(orderId).then(setBooking);
    }
  }, [orderId]);

  return (
    <div className="bg-white min-h-screen">
      <EventSummary />
      <BookingProgress currentStep={7} />

      <main className="max-w-3xl mx-auto px-4 pt-10 pb-32">
        {/* Success Animation Area */}
        <div className="flex flex-col items-center text-center mb-12">
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 200 }}
                className="h-24 w-24 rounded-full bg-emerald-50 flex items-center justify-center mb-6"
            >
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </motion.div>

            <motion.h1
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-black italic uppercase text-slate-900 tracking-tight mb-2"
            >
                Booking Confirmed!
            </motion.h1>
            <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-slate-500 font-medium"
            >
                Your celebration is officially on our calendar.
            </motion.p>
        </div>

        {/* Booking Card */}
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
        >
            <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-white">
                <div className="p-8 border-b border-slate-50 bg-[#6D28D9]/5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-[#6D28D9] uppercase tracking-widest mb-1">Booking Reference</p>
                        <h2 className="text-xl font-black text-slate-900 uppercase">#{booking?.bookingNumber || orderId?.slice(0, 8).toUpperCase()}</h2>
                    </div>
                    <Badge className="bg-emerald-500 text-white border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase">
                        Confirmed
                    </Badge>
                </div>

                <div className="p-8 space-y-8">
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-2xl bg-slate-50 border flex items-center justify-center shrink-0">
                            <Store className="h-10 w-10 text-[#6D28D9]/20" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-[#6D28D9] uppercase tracking-widest">Service Vendor</p>
                            <h3 className="text-2xl font-black text-slate-900 italic uppercase">
                                {booking?.vendorprofile?.businessName || "Verified Vendor"}
                            </h3>
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
                                <Sparkles className="h-3 w-3" /> {booking?.eventType || "Special Celebration"}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</p>
                            <p className="text-2xl font-black text-slate-900">{formatCurrency(booking?.totalAmount || 0)}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Date</p>
                            <p className="text-xl font-black text-slate-900 italic uppercase">
                                {booking?.eventDate ? new Date(booking.eventDate).toLocaleDateString() : "TBD"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 flex flex-wrap justify-center gap-4 border-t border-slate-100">
                    <Button variant="ghost" className="text-[10px] font-black uppercase text-slate-500 hover:text-[#6D28D9]">
                        <FileText className="h-4 w-4 mr-2" /> View Invoice
                    </Button>
                    <Button variant="ghost" className="text-[10px] font-black uppercase text-slate-500 hover:text-[#6D28D9]">
                        <Download className="h-4 w-4 mr-2" /> Booking PDF
                    </Button>
                    <Button variant="ghost" className="text-[10px] font-black uppercase text-slate-500 hover:text-[#6D28D9]">
                        <Share2 className="h-4 w-4 mr-2" /> Share Booking
                    </Button>
                </div>
            </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12"
        >
            <Button
                onClick={() => router.push("/customer/bookings")}
                className="h-16 rounded-2xl font-black text-lg bg-[#6D28D9] hover:bg-[#6D28D9]/90 shadow-xl shadow-[#6D28D9]/20"
            >
                <MessageSquare className="h-5 w-5 mr-2" /> Contact Vendor
            </Button>
            <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="h-16 rounded-2xl font-black text-lg border-2"
            >
                <Home className="h-5 w-5 mr-2" /> Back to Home
            </Button>
        </motion.div>
      </main>
    </div>
  );
}

export default function BookingSuccessPage() {
    return (
        <Suspense fallback={null}>
            <SuccessContent />
        </Suspense>
    );
}
