"use client"

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { customerService } from "@/services/client";

export default function NewReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorId = searchParams?.get("vendorId");

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  const { mutate: submitReview, isPending } = useMutation({
    mutationFn: async () => {
      if (!vendorId) throw new Error("Vendor ID is missing");
      return customerService.submitReview({ vendorId, rating, comment });
    },
    onSuccess: () => {
      toast({ title: "Review submitted successfully!" });
      router.push("/customer/reviews");
    },
    onError: (error: any) => {
      toast({
        title: "Error submitting review",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  if (!vendorId) return <div className="container py-8">Invalid vendor ID.</div>;

  return (
    <div className="container py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Write a Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-medium">How was your experience?</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hover || rating) ? "fill-primary text-primary" : "text-muted"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Your Feedback</label>
            <Textarea
              placeholder="Tell us what you liked or how we can improve..."
              className="min-h-[150px]"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={() => submitReview()}
            disabled={isPending || rating === 0 || !comment}
          >
            {isPending ? "Submitting..." : "Post Review"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
