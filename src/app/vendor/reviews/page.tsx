import { getAuthPayload } from "@/lib/auth";
import { getVendorReviews } from "@/lib/reviews";
import { redirect } from "next/navigation";
import ReviewsClient from "./ReviewsClient";

export default async function VendorReviewsPage() {
  const payload = await getAuthPayload();

  if (!payload || payload.role !== "VENDOR") {
    redirect("/auth/login");
  }

  const reviews = await getVendorReviews(payload.userId);

  return <ReviewsClient initialReviews={JSON.parse(JSON.stringify(reviews))} />;
}
