"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Download, Home, Calendar, Package } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams?.get("bookingId");
  const { accessToken } = useAuthStore();
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (bookingId && accessToken) {
      axios.get(`/api/bookings?id=${bookingId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }).then(res => setBooking(res.data));
    }
  }, [bookingId, accessToken]);

  if (!booking) return <div className="h-screen flex items-center justify-center">Loading booking details...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-muted-foreground mb-8">
            Your booking <span className="font-bold text-foreground">{booking.bookingNumber}</span> has been successfully placed.
          </p>

          <Card className="text-left mb-8 overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 bg-primary/5 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Vendor</p>
                    <h3 className="font-bold text-lg">{booking.vendor.businessName}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Amount Paid</p>
                    <h3 className="font-bold text-lg text-primary">₹{Number(booking.totalAmount).toLocaleString('en-IN')}</h3>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Event Date</p>
                    <p className="text-sm text-muted-foreground">{new Date(booking.eventDate).toLocaleDateString()} at {booking.eventTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Package/Service</p>
                    <p className="text-sm text-muted-foreground">{booking.items?.[0]?.service?.name}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="w-full" onClick={() => window.print()}>
              <Download className="mr-2 h-4 w-4" /> Download Invoice
            </Button>
            <Button className="w-full" onClick={() => router.push("/customer/dashboard")}>
              <Home className="mr-2 h-4 w-4" /> Go to Dashboard
            </Button>
          </div>
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
