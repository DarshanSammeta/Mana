"use client";

import { useCompareStore } from "@/store/useCompareStore";
import { Button } from "@/components/ui/button";
import { X, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { optimizeImage } from "@/lib/cloudinary";

export function CompareFloatingBar() {
  const { vendors, removeVendor, clearCompare } = useCompareStore();

  if (vendors.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
      >
        <div className="bg-[#111827] text-white rounded-2xl shadow-2xl border border-white/10 p-4 md:p-6 flex items-center justify-between gap-6 overflow-hidden">
          <div className="flex items-center gap-4 flex-1 overflow-x-auto no-scrollbar py-2">
            <div className="hidden md:flex flex-col gap-0.5 shrink-0">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comparing</span>
               <span className="text-xl font-black">{vendors.length} Vendors</span>
            </div>

            <div className="flex items-center gap-3">
               {vendors.map((vendor) => (
                 <div key={vendor.id} className="relative group shrink-0">
                    <div className="h-12 w-12 rounded-xl overflow-hidden border-2 border-white/20 relative">
                       <Image
                         src={optimizeImage(vendor.coverImage, 'thumbnail') || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=200"}
                         fill
                         className="object-cover"
                         alt={vendor.businessName}
                       />
                    </div>
                    <button
                      onClick={() => removeVendor(vendor.id)}
                      className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                       <X className="h-3 w-3" />
                    </button>
                 </div>
               ))}

               {vendors.length < 4 && (
                 <div className="h-12 w-12 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center shrink-0">
                    <span className="text-white/20 text-xs font-bold">{4 - vendors.length}+</span>
                 </div>
               )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
             <button
               onClick={clearCompare}
               className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors hidden md:block"
             >
                Clear
             </button>
             <Link href="/marketplace/compare">
                <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-[11px] px-6 h-12 shadow-lg shadow-blue-900/20">
                   Compare Now
                   <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
             </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
