import BookingDetailsPage from "../../bookings/[id]/page";

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    return <BookingDetailsPage params={params} />;
}
