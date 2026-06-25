"use client";

import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const slides = [
  {
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop",
    title: "Dream Weddings",
    subtitle: "Premium Decor starting at ₹49,999",
    tag: "MOST POPULAR"
  },
  {
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=2069&auto=format&fit=crop",
    title: "Corporate Excellence",
    subtitle: "Top Catering from ₹499/plate",
    tag: "PROFESSIONAL"
  },
  {
    image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=2070&auto=format&fit=crop",
    title: "Vibrant Celebrations",
    subtitle: "DJ & Sound Systems | Save up to 20%",
    tag: "LATEST OFFERS"
  },
  {
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop",
    title: "Picture Perfect",
    subtitle: "Cinematic Photography Packages",
    tag: "TOP RATED"
  }
];

export function MarketplaceHero() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[650px] overflow-hidden group bg-[#1E293B]">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0"
        >
          {/* Background Image with Professional Gradient */}
          <div className="relative w-full h-full">
             <img
                src={slides[current].image}
                className="w-full h-full object-cover opacity-60"
                alt="Hero"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1E293B]/80 via-[#1E293B]/40 to-transparent z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1E293B] via-transparent to-transparent z-10" />
          </div>

          <div className="container mx-auto px-6 md:px-12 relative z-20 h-full flex items-center">
            <div className="max-w-2xl">
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2 }}
                 className="flex items-center gap-2 mb-4"
               >
                  <span className="bg-[#5B7CFA]/20 backdrop-blur-md text-[#FFFFFF] text-[10px] font-black px-3 py-1 rounded-full tracking-widest border border-[#5B7CFA]/30 uppercase">
                    {slides[current].tag}
                  </span>
                  <div className="flex items-center gap-1 text-[#6FCF97]">
                    <Sparkles className="h-3 w-3 fill-current" />
                    <span className="text-[10px] font-bold tracking-widest uppercase">Verified Marketplace</span>
                  </div>
               </motion.div>

               <motion.div
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.3 }}
               >
                 <h2 className="text-5xl md:text-7xl font-extrabold text-[#FFFFFF] mb-6 leading-[1.1] tracking-tight">
                   {slides[current].subtitle}
                 </h2>
                 <p className="text-lg md:text-xl text-[#94A3B8] mb-10 font-medium max-w-lg leading-relaxed">
                   Book top-rated {slides[current].title.toLowerCase()} for your next event with Mana's secure marketplace.
                 </p>
               </motion.div>

               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.4 }}
                 className="flex flex-wrap gap-4"
               >
                  <Button className="bg-[#5B7CFA] hover:bg-[#4C6EF5] text-[#FFFFFF] px-10 py-7 rounded-lg font-bold text-base shadow-sm border border-[#5B7CFA] transition-all active:scale-95">
                     EXPLORE SERVICES
                  </Button>
                  <Button variant="outline" className="bg-[#FFFFFF]/10 backdrop-blur-md border-[#FFFFFF]/30 text-[#FFFFFF] hover:bg-[#FFFFFF]/20 px-10 py-7 rounded-lg font-bold text-base transition-all active:scale-95">
                     HOW IT WORKS
                  </Button>
               </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Indicators */}
      <div className="absolute bottom-40 left-12 z-30 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 transition-all rounded-full ${i === current ? 'w-8 bg-[#5B7CFA]' : 'w-2 bg-[#FFFFFF]/30 hover:bg-[#FFFFFF]/50'}`}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="absolute bottom-12 right-12 z-30 flex gap-3">
        <button
          onClick={prev}
          className="p-4 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all rounded-2xl border border-white/10 text-white"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={next}
          className="p-4 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all rounded-2xl border border-white/10 text-white"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
