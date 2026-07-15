"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Download, Home, Calendar, Package } from "lucide-react";
import { customerService } from "@/services/client";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams?.get("bookingId");
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (bookingId) {
      customerService.getBookingById(bookingId).then(setBooking);
    }
  }, [bookingId]);


  if (!booking) return <div className="h-screen flex items-center justify-center">Loading booking details...</div>;

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="mb-8 flex justify-center">
            <div className="h-24 w-24 bg-green-50 rounded-full flex items-center justify-center border border-green-100 shadow-sm">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Booking Confirmed!</h1>
          <p className="text-slate-600 text-lg mb-10">
            Order <span className="font-bold text-slate-900">#{booking.bookingNumber}</span> has been successfully placed.
          </p>

          <Card className="text-left mb-10 overflow-hidden border-slate-200 shadow-xl rounded-2xl">
            <CardContent className="p-0">
              <div className="p-8 bg-slate-50 border-b border-slate-100">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-primary mb-2">Vendor Information</p>
                    <h3 className="font-black text-2xl text-slate-900">{booking.vendor.businessName}</h3>
                  </div>
                  <div className="md:text-right">
                    <p className="text-xs font-black uppercase tracking-widest text-primary mb-2">Amount Paid</p>
                    <h3 className="font-black text-3xl text-primary">₹{Number(booking.totalAmount).toLocaleString('en-IN')}</h3>
                  </div>
                </div>
              </div>
              <div className="p-8 grid md:grid-cols-2 gap-8">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 mb-1">Event Schedule</p>
                    <p className="text-slate-600 font-medium">{new Date(booking.eventDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="text-slate-500 text-sm mt-0.5">{booking.eventTime}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Package className="h-6 w-6 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 mb-1">Service Details</p>
                    <p className="text-slate-600 font-medium">{booking.items?.[0]?.service?.name || "Premium Event Service"}</p>
                    <p className="text-slate-500 text-sm mt-0.5">Professional Grade</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
            <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-slate-200 hover:bg-slate-50 shadow-sm" onClick={() => window.print()}>
              <Download className="mr-2 h-4 w-4" /> Download Invoice
            </Button>
            <Button className="w-full h-12 rounded-xl font-black bg-primary hover:bg-blue-700 text-white shadow-lg transition-all" onClick={() => router.push("/customer/dashboard")}>
              <Home className="mr-2 h-4 w-4" /> Go to Dashboard
            </Button>
          </div>

          <p className="mt-12 text-sm text-slate-400">
            A confirmation email has been sent to your registered email address.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function OrderSuccessPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
