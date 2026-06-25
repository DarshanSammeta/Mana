"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { Star, MessageSquare, Quote, Calendar, Reply, Search, Filter, TrendingUp, ThumbsUp, ChevronDown, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { EmptyState } from "@/components/common/EmptyState";

export default function VendorReviewsPage() {
  const { accessToken } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState("All");
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["vendor-reviews"],
    queryFn: async () => {
      const res = await axios.get("/api/reviews?role=VENDOR", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.data;
    },
    enabled: !!accessToken,
  });

  const replyMutation = useMutation({
    mutationFn: async ({ reviewId, vendorResponse }: { reviewId: string, vendorResponse: string }) => {
      const res = await axios.patch(`/api/reviews/${reviewId}`, { vendorResponse }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Reply posted successfully");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ["vendor-reviews"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to post reply");
    }
  });

  const handleReply = (reviewId: string) => {
    const text = replyText[reviewId];
    if (!text?.trim()) {
      toast.error("Please enter a response");
      return;
    }
    replyMutation.mutate({ reviewId, vendorResponse: text });
  };

  const filteredReviews = reviews?.filter((review: any) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Unanswered") return !review.vendorResponse;
    if (activeFilter === "Critical") return review.rating <= 3;
    return true;
  }) || [];

  const avgRating = reviews?.length
    ? (reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const stats = [
    { title: "Average Rating", value: avgRating, icon: Star, color: "text-amber-500", bg: "bg-amber-500/10", trend: "Based on all reviews" },
    { title: "Total Reviews", value: reviews?.length || 0, icon: Quote, color: "text-indigo-500", bg: "bg-indigo-500/10", trend: "Total customer feedback" },
    { title: "Response Rate", value: reviews?.length ? `${Math.round((reviews.filter((r: any) => r.vendorResponse).length / reviews.length) * 100)}%` : "0%", icon: MessageSquare, color: "text-emerald-500", bg: "bg-emerald-500/10", trend: "Replied reviews" },
  ];

  const ratingCounts = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews?.filter((r: any) => r.rating === stars).length || 0,
    percentage: reviews?.length ? (reviews.filter((r: any) => r.rating === stars).length / reviews.length) * 100 : 0
  }));

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Review Analytics</h1>
          <p className="text-slate-500 text-lg mt-1">Monitor your reputation and engage with your customers.</p>
        </div>
        <div className="flex gap-3">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input placeholder="Search feedback..." className="pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm w-64 font-bold focus:ring-2 focus:ring-blue-600/20 outline-none" />
            </div>
            <button className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all">
                <Filter className="h-5 w-5 text-slate-600" />
            </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((stat, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={stat.title}
                    className="p-8 rounded-[32px] bg-white border border-slate-100 hover:border-blue-600/20 transition-all group shadow-sm"
                  >
                      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", stat.bg)}>
                          <stat.icon className={cn("h-6 w-6", stat.color)} />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.title}</p>
                      <div className="text-4xl font-black mt-1 text-slate-900">{stat.value}</div>
                      <p className="text-[10px] font-bold text-emerald-500 mt-2 uppercase tracking-widest">{stat.trend}</p>
                  </motion.div>
              ))}
          </div>

          <div className="p-8 rounded-[32px] bg-white border border-slate-100 shadow-sm">
              <h3 className="font-black text-lg mb-6 text-slate-900">Rating Breakdown</h3>
              <div className="space-y-4">
                  {ratingCounts.map((row) => (
                      <div key={row.stars} className="flex items-center gap-4">
                          <span className="text-xs font-black w-4 text-slate-600">{row.stars}</span>
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${row.percentage}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="h-full bg-amber-500 rounded-full"
                              />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{row.count}</span>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* Review Feed */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
            <div className="flex gap-8">
                {["All", "Recent", "Critical", "Unanswered"].map((f) => (
                    <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={cn(
                            "text-sm font-black uppercase tracking-widest pb-1 transition-all relative",
                            activeFilter === f ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        {f}
                        {activeFilter === f && (
                            <motion.div layoutId="review-filter" className="absolute -bottom-6 left-0 right-0 h-1 bg-blue-600 rounded-full" />
                        )}
                    </button>
                ))}
            </div>
            <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                Sort by: Newest <ChevronDown className="h-4 w-4" />
            </button>
        </div>

        <div className="space-y-6">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="p-8 rounded-[32px] bg-white border border-slate-100 space-y-4 shadow-sm">
              <div className="flex justify-between">
                <div className="flex gap-4">
                  <Skeleton className="h-14 w-14 rounded-2xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ))
        ) : filteredReviews.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={activeFilter === "All" ? "No Reviews Yet" : "No Reviews Found"}
            description={activeFilter === "All"
              ? "When customers book your services and leave feedback, they will appear here."
              : `You don't have any reviews matching the "${activeFilter}" filter.`
            }
          />
        ) : (
          filteredReviews.map((review: any) => (
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                key={review.id}
                className="p-8 rounded-[32px] bg-white border border-slate-100 hover:shadow-2xl hover:shadow-blue-600/5 transition-all duration-500 group"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                  <div className="flex gap-5">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                        {review.user?.fullName?.[0] || "C"}
                    </div>
                    <div>
                        <h3 className="text-xl font-black tracking-tight text-slate-900">{review.user?.fullName}</h3>
                        <p className="text-sm font-bold text-slate-500 mt-0.5">{review.service?.title || "Event Service"}</p>
                        <div className="flex items-center gap-1 mt-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className={cn("h-3.5 w-3.5", s <= review.rating ? "fill-amber-500 text-amber-500" : "text-slate-200")} />
                            ))}
                            <span className="text-[10px] font-black text-slate-400 ml-2 uppercase tracking-widest">{review.rating.toFixed(1)} Rating</span>
                        </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{format(new Date(review.createdAt), "dd MMM, yyyy")}</span>
                      {!review.vendorResponse && (
                        <button
                          onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                        >
                          Reply
                        </button>
                      )}
                  </div>
              </div>

              <div className="relative pl-6 border-l-4 border-blue-600/10 mb-8">
                  <p className="text-lg font-medium text-slate-700 leading-relaxed italic">
                      "{review.comment}"
                  </p>
              </div>

              {/* Reply Section */}
              <AnimatePresence>
                {review.vendorResponse ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-50 p-6 rounded-3xl relative ml-8 border border-slate-100 group-hover:border-blue-600/20 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                          <Reply className="h-5 w-5 text-white -scale-x-100" />
                      </div>
                      <div>
                          <span className="font-black text-[10px] uppercase tracking-widest text-blue-600 block leading-none">Your Response</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Replied on {format(new Date(review.responseAt || review.updatedAt), "dd MMM")}</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-slate-600 leading-relaxed">
                      "{review.vendorResponse}"
                    </p>
                  </motion.div>
                ) : replyingTo === review.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-8 space-y-4 overflow-hidden"
                  >
                    <textarea
                      placeholder="Type your response to the customer..."
                      className="w-full bg-slate-50 border-none rounded-3xl p-6 text-sm font-bold focus:ring-2 focus:ring-blue-600/20 outline-none min-h-[120px] text-slate-700"
                      value={replyText[review.id] || ""}
                      onChange={(e) => setReplyText({ ...replyText, [review.id]: e.target.value })}
                    />
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setReplyingTo(null)}
                        className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReply(review.id)}
                        disabled={replyMutation.isPending}
                        className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {replyMutation.isPending ? "Posting..." : <>Post Reply <Send className="h-3 w-3" /></>}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
        </div>
      </div>
    </div>
  );
}
