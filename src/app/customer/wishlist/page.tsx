"use client";

import { useState, useEffect } from "react";
import {
  Heart,
  Trash2,
  Star,
  MapPin,
  Zap,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { customerService } from "@/services/client";
import { toast } from "react-hot-toast";

export default function WishlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const data = await customerService.getWishlist();
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch wishlist", error);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (targetId: string, _type: string) => {
    try {
      await customerService.removeFromWishlist(targetId);
      setItems(items.filter(item => item.targetId !== targetId));
      toast.success("Item removed from wishlist");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Wishlist</h1>
          <p className="text-slate-500 mt-1 font-medium">Services and vendors you&apos;ve saved for your upcoming events.</p>
        </div>
        <div className="bg-white border border-slate-200 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
          <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
          <span className="text-lg font-black text-slate-900">{items.length}</span>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l border-slate-100 pl-3">Saved Items</span>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item) => {
            const detail = item.details;
            if (!detail) return null;

            return (
              <div key={item.id} className="group bg-white border border-slate-200 rounded-[2rem] overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all">
                <div className="relative h-56 bg-slate-100 overflow-hidden">
                  {detail.logo || detail.coverImage ? (
                    <Image
                      src={detail.logo || detail.coverImage}
                      alt={detail.businessName || detail.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Zap className="h-16 w-16 text-slate-200" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <button
                    onClick={() => removeItem(item.targetId, item.type)}
                    className="absolute top-4 right-4 h-10 w-10 bg-white/90 backdrop-blur-md rounded-xl text-slate-400 hover:text-rose-500 shadow-sm flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-10"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>

                  <Badge className="absolute top-4 left-4 bg-primary text-white font-black text-[10px] tracking-widest border-none px-3 py-1 shadow-lg">
                    {item.type}
                  </Badge>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg">
                       <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                       <span className="text-xs font-black text-amber-700">{detail.rating || "NEW"}</span>
                    </div>
                    {detail.city && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <MapPin className="h-3.5 w-3.5" />
                        {detail.city}
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                    {detail.businessName || detail.title}
                  </h3>

                  <p className="text-sm text-slate-500 font-medium mt-1 line-clamp-1">
                    {detail.service?.[0]?.title || "Premium Professional Event Services"}
                  </p>

                  <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Starting Price</p>
                       <p className="text-lg font-black text-slate-900">₹{(detail.basePrice || detail.service?.[0]?.basePrice || 0).toLocaleString()}</p>
                    </div>
                    <Link href={`/marketplace/vendor/${detail.id}`}>
                      <Button className="bg-slate-900 hover:bg-primary text-white font-extrabold rounded-xl px-6 transition-all shadow-lg hover:shadow-primary/20">
                        VIEW DETAILS
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
           <div className="h-24 w-24 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 flex items-center justify-center mx-auto mb-8">
              <Heart className="h-12 w-12 text-slate-200" />
           </div>
           <h3 className="text-2xl font-extrabold text-slate-900">Your wishlist is empty</h3>
           <p className="text-slate-500 mt-2 font-medium max-w-sm mx-auto">
             Save your favorite vendors and services here to easily find them when you&apos;re ready to plan your next event.
           </p>
           <Link href="/marketplace">
              <Button className="mt-10 bg-primary hover:bg-blue-700 text-white font-extrabold rounded-2xl px-12 py-7 h-auto shadow-xl shadow-primary/20 transition-all hover:scale-105">
                BROWSE MARKETPLACE
              </Button>
           </Link>
        </div>
      )}

      {/* Recommended Section */}
      <div className="mt-20 pt-16 border-t border-slate-100">
         <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Handpicked for you</h2>
            <Link href="/marketplace" className="text-sm font-bold text-primary hover:underline">View All Recommendations</Link>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="group space-y-4 cursor-pointer">
                 <div className="aspect-square bg-white rounded-3xl border border-slate-100 overflow-hidden relative shadow-sm group-hover:shadow-xl transition-all">
                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors z-10" />
                    <div className="h-full w-full bg-slate-50 flex items-center justify-center">
                       <Package className="h-10 w-10 text-slate-200" />
                    </div>
                 </div>
                 <div className="px-1">
                    <h4 className="text-sm font-extrabold text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">Premium Service Recommendation</h4>
                    <div className="flex items-center justify-between mt-2">
                       <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          <span className="text-[10px] font-black text-slate-700">4.9</span>
                       </div>
                       <p className="text-xs font-black text-primary">₹25,000</p>
                    </div>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
