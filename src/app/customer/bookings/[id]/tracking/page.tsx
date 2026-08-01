import { Suspense } from "react";
import TrackingClient from "./TrackingClient";

export default async function BookingTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black uppercase italic animate-pulse">Initializing Tracking Hub...</div>}>
      <TrackingClient bookingId={id} />
    </Suspense>
  );
}
