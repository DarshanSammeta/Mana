"use client";

import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { optimizeImage } from "@/lib/cloudinary";
import Image from "next/image";
import Link from "next/link";
import { Star, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { IMAGES } from "@/constants";

export function RecentlyViewed() {
  const { recentlyViewed } = useRecentlyViewed();

  if (recentlyViewed.length === 0) return null;

  return (
    <section className="py-12 bg-white">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Recently Viewed</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Inspired by your browsing history</p>
          </div>
          <button className="text-[11px] font-black text-purple-600 uppercase tracking-widest hover:underline flex items-center gap-1">
            Manage History <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {recentlyViewed.map((vendor, idx) => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link href={`/marketplace/vendor/${vendor.id}`} className="group block">
                <div className="aspect-[4/5] relative rounded-2xl overflow-hidden bg-slate-50 mb-3 border border-slate-100 transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                  <Image
                    src={optimizeImage(vendor.coverImage, 'card') || IMAGES.DEFAULT_EVENT}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    alt={vendor.businessName}
                  />
                  <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
                    <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
                    <span className="text-[10px] font-black text-slate-700">{vendor.rating || "4.8"}</span>
                  </div>
                </div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-purple-600 transition-colors truncate">{vendor.businessName}</h4>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] font-bold text-slate-400 truncate">{vendor.city}</span>
                  <span className="text-xs font-black text-slate-900">₹{Number(vendor.basePrice).toLocaleString()}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
