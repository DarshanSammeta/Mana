"use client";

import { useEffect, useState, use } from "react";
import { useAuthStore } from "@/store/authStore";
import Navbar from "@/components/common/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  MessageSquare,
  FileText,
  Download,
  Info,
  CheckCircle2,
  Package,
  ArrowRight
} from "lucide-react";
import axios from "axios";
import Link from "next/link";

export default function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { accessToken } = useAuthStore();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accessToken) {
      axios.get(`/api/bookings?id=${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      .then(res => setBooking(res.data))
      .finally(() => setLoading(false));
    }
  }, [id, accessToken]);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading event details...</div>;
  if (!booking) return <div className="h-screen flex items-center justify-center">Event not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant={booking.status === "CONFIRMED" ? "default" : "secondary"}>
                  {booking.status}
                </Badge>
                <span className="text-sm text-muted-foreground font-mono">{booking.bookingNumber}</span>
              </div>
              <h1 className="text-3xl font-bold">{booking.eventName || "Event Booking"}</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Download className="mr-2 h-4 w-4" /> Download Invoice
              </Button>
              <Link href={`/customer/chat?vendorId=${booking.vendor.id}`}>
                <Button>
                  <MessageSquare className="mr-2 h-4 w-4" /> Chat with Vendor
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" /> Event Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date & Time</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium">{new Date(booking.eventDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">{booking.eventTime}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Guest Count</p>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-medium">{booking.guestCount} People</span>
                    </div>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Location</p>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-primary mt-1" />
                      <span className="font-medium">
                        {booking.eventLocation}, {booking.landmark && `${booking.landmark}, `}{booking.city}, {booking.state} - {booking.pincode}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Package Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" /> Package Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="p-4 bg-muted rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-bold">{booking.items?.[0]?.service?.name}</p>
                            <p className="text-sm text-muted-foreground">{booking.items?.[0]?.package?.name || "Standard Package"}</p>
                        </div>
                        <p className="font-bold text-lg">₹{Number(booking.items?.[0]?.price).toLocaleString('en-IN')}</p>
                    </div>
                    {booking.specialInstructions && (
                        <div className="mt-4">
                            <p className="text-sm font-bold mb-1">Special Instructions:</p>
                            <p className="text-sm text-muted-foreground p-3 bg-gray-50 rounded border italic">"{booking.specialInstructions}"</p>
                        </div>
                    )}
                </CardContent>
              </Card>

              {/* Timeline / Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Activity Feed</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div className="w-[2px] flex-1 bg-gray-200 my-2" />
                            </div>
                            <div className="pb-6">
                                <p className="font-bold text-sm">Booking Confirmed</p>
                                <p className="text-xs text-muted-foreground">{new Date(booking.createdAt).toLocaleString('en-IN')}</p>
                                <p className="text-sm mt-1">Your booking has been confirmed and payment was successful.</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side: Vendor & Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-lg">Vendor</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                            {booking.vendor.businessName[0]}
                        </div>
                        <div>
                            <p className="font-bold">{booking.vendor.businessName}</p>
                            <p className="text-xs text-muted-foreground">{booking.vendor.category}</p>
                        </div>
                    </div>
                    <Link href={`/marketplace/vendor/${booking.vendor.id}`}>
                        <Button variant="link" className="p-0 h-auto text-primary flex items-center gap-1 text-sm">
                            View Profile <ArrowRight className="h-3 w-3" />
                        </Button>
                    </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Payment Summary</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{Number(booking.subTotal).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxes</span>
                    <span>₹{Number(booking.taxAmount).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-bold">
                    <span>Total Paid</span>
                    <span className="text-primary">₹{Number(booking.totalAmount).toLocaleString('en-IN')}</span>
                  </div>
                  {booking.payments?.[0] && (
                      <div className="mt-4 p-3 bg-gray-50 rounded text-[10px] font-mono text-muted-foreground break-all">
                          ID: {booking.payments[0].razorpayPaymentId}
                      </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
