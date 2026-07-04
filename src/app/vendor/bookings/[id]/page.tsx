import { getAuthPayload } from "@/lib/auth";
import { getBookingDetails, getBookingTeam } from "@/lib/bookings";
import { redirect, notFound } from "next/navigation";
import BookingDetailsClient from "./BookingDetailsClient";

export default async function VendorBookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const payload = await getAuthPayload();

  if (!payload || payload.role !== "VENDOR") {
    redirect("/auth/login");
  }

  const [booking, team] = await Promise.all([
    getBookingDetails(id, payload.userId, payload.role),
    getBookingTeam(id)
  ]);

  if (!booking) {
    notFound();
  }

  return (
    <BookingDetailsClient
      id={id}
      initialBooking={JSON.parse(JSON.stringify(booking))}
      initialTeam={JSON.parse(JSON.stringify(team))}
    />
  );
}
