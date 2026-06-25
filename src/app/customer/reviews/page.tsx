"use client";

import { useState, useEffect } from "react";
import {
  Star,
  MessageSquare,
  ThumbsUp,
  MoreVertical,
  Image as ImageIcon,
  CheckCircle2,
  Package,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function CustomerReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/customer/reviews", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (error) {
      console.error("Failed to fetch reviews", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your Reviews</h1>
          <p className="text-sm text-muted-foreground">Manage and view your feedback for vendors</p>
        </div>
        <div className="bg-primary/5 rounded-xl px-4 py-2 border border-primary/10 flex items-center gap-4">
           <div>
              <p className="text-[10px] font-black text-primary uppercase">Avg Rating Given</p>
              <div className="flex items-center gap-1.5">
                 <Star className="h-4 w-4 fill-primary text-primary" />
                 <span className="text-lg font-black text-primary">4.8</span>
              </div>
           </div>
           <div className="w-px h-8 bg-primary/20" />
           <div>
              <p className="text-[10px] font-black text-primary uppercase">Total Reviews</p>
              <p className="text-lg font-black text-primary">{reviews.length}</p>
           </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow">
               <div className="flex flex-col md:flex-row gap-6">
                  <div className="shrink-0">
                     <div className="h-16 w-16 bg-muted/50 rounded-xl border border-border/50 flex items-center justify-center overflow-hidden">
                        {review.vendorprofile.logo ? (
                           <img src={review.vendorprofile.logo} alt={review.vendorprofile.businessName} className="h-full w-full object-cover" />
                        ) : (
                           <Package className="h-8 w-8 text-muted-foreground/30" />
                        )}
                     </div>
                  </div>

                  <div className="flex-1 min-w-0">
                     <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                        <div>
                           <h3 className="font-bold text-foreground">{review.vendorprofile.businessName}</h3>
                           <p className="text-xs text-muted-foreground">{review.service?.title || "Event Service"}</p>
                        </div>
                        <div className="text-right">
                           <div className="flex items-center gap-0.5 mb-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={cn(
                                    "h-4 w-4",
                                    s <= review.rating ? "fill-cta text-cta" : "text-muted/60"
                                  )}
                                />
                              ))}
                           </div>
                           <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">
                             Reviewed on {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                           </p>
                        </div>
                     </div>

                     <div className="bg-muted/30 rounded-xl p-4 mt-4 relative">
                        <div className="absolute -top-2 left-4 text-muted/50">
                           <MessageSquare className="h-8 w-8 fill-muted/30" />
                        </div>
                        <p className="text-sm text-foreground italic leading-relaxed">"{review.comment}"</p>

                        {review.images && review.images.length > 0 && (
                           <div className="flex gap-2 mt-4">
                              {review.images.map((img: string, idx: number) => (
                                 <div key={idx} className="h-14 w-14 rounded-lg overflow-hidden border border-border">
                                    <img src={img} className="h-full w-full object-cover" />
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>

                     {review.vendorResponse && (
                        <div className="mt-6 pl-6 border-l-2 border-primary/20">
                           <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-primary/10 text-primary text-[9px] font-black border-none px-2 py-0">VENDOR RESPONSE</Badge>
                              <span className="text-[10px] text-muted-foreground">{format(new Date(review.responseAt || review.createdAt), 'MMM dd')}</span>
                           </div>
                           <p className="text-sm text-muted-foreground">{review.vendorResponse}</p>
                        </div>
                     )}

                     <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                           <button className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
                              <ThumbsUp className="h-3.5 w-3.5" /> 12 Helpful
                           </button>
                           <button className="text-xs font-bold text-muted-foreground hover:text-primary">Edit Review</button>
                        </div>
                        <Link href={`/marketplace/vendor/${review.vendorId}`} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                           View Vendor <ArrowRight className="h-3 w-3" />
                        </Link>
                     </div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-muted/50 rounded-3xl border-2 border-dashed border-border">
           <div className="h-20 w-20 bg-card rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Star className="h-10 w-10 text-muted/60" />
           </div>
           <h3 className="text-xl font-bold text-foreground">No reviews shared yet</h3>
           <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
             Share your experience with vendors you've worked with to help other customers make better choices.
           </p>
           <Link href="/customer/bookings">
              <Button className="mt-8 bg-primary hover:bg-primary/90 font-bold px-10 rounded-xl">
                Go to Bookings
              </Button>
           </Link>
        </div>
      )}
    </div>
  );
}
