"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, ShieldCheck, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { RecentlyViewed } from "@/components/home/RecentlyViewed";
import { optimizeImage } from "@/lib/cloudinary";
import { HERO_SLIDES, IMAGES, EVENT_TYPE_ICONS } from "@/constants";

const eventIcon = IMAGES.DEFAULT_EVENT;

interface HomeClientProps {
  initialFeatured?: any[];
  initialTrending?: any[];
  initialEventTypes?: any[];
}

export default function HomeClient({
  initialFeatured = [],
  initialTrending = [],
  initialEventTypes = [],
}: HomeClientProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const dynamicSlides = (initialEventTypes && initialEventTypes.length > 0)
    ? initialEventTypes.slice(0, 5).map((type: any) => ({
        image: type.image || HERO_SLIDES[0].image,
        title: type.name === "Wedding" ? "Plan Your Perfect Wedding" : `Unforgettable ${type.name}`,
        subtitle: type.description || `Discover elite professionals for your ${(type.name || "event").toLowerCase()}.`,
      }))
    : HERO_SLIDES;

  useEffect(() => {
    if (!dynamicSlides.length) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % dynamicSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [dynamicSlides.length]);

  return (
    <div className="bg-[#EAEDED]">
      {/* Hero Section */}
      <section className="relative w-full h-[250px] md:h-[600px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <Image
              src={dynamicSlides[currentSlide]?.image || HERO_SLIDES[0].image}
              alt={dynamicSlides[currentSlide]?.title || HERO_SLIDES[0].title}
              fill
              className="object-cover"
              priority
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#EAEDED] z-10" />
          </motion.div>
        </AnimatePresence>

        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + dynamicSlides.length) % dynamicSlides.length)}
          aria-label="Previous slide"
          className="absolute left-0 top-[30%] md:top-[40%] -translate-y-1/2 z-30 p-4 hover:border-2 border-white/50 rounded-sm text-black/70 hover:text-black transition-all"
        >
          <ChevronLeft className="h-12 w-12" />
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % dynamicSlides.length)}
          aria-label="Next slide"
          className="absolute right-0 top-[30%] md:top-[40%] -translate-y-1/2 z-30 p-4 hover:border-2 border-white/50 rounded-sm text-black/70 hover:text-black transition-all"
        >
          <ChevronRight className="h-12 w-12" />
        </button>
      </section>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 relative z-20 -mt-10 md:-mt-64 space-y-8 pb-12">
        {/* Amazon-style Card Grid (Level 13 - AI/Personalized) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 shadow-md rounded-none flex flex-col h-full">
            <h3 className="text-xl font-black mb-4">Top Rated Planners</h3>
            <div className="grid grid-cols-2 gap-4 flex-1">
              {initialFeatured?.filter(v => v && v.id).slice(0, 4).map((v) => (
                <Link key={v.id} href={`/marketplace/vendor/${v.id}`} className="group">
                  <div className="aspect-square relative mb-2 overflow-hidden bg-slate-100">
                    <Image
                      src={optimizeImage(v.coverImage, 'card')}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      alt={v.businessName || "Vendor"}
                    />
                  </div>
                  <p className="text-xs font-bold truncate">{v.businessName}</p>
                </Link>
              ))}
              {(!initialFeatured || initialFeatured.length === 0) && Array(4).fill(0).map((_, i) => (
                <div key={i} className="aspect-square bg-slate-50 animate-pulse" />
              ))}
            </div>
            <Link href="/marketplace?category=Wedding Planner" className="text-blue-600 hover:text-orange-600 text-sm font-bold mt-4">See more</Link>
          </div>

          <div className="bg-white p-6 shadow-md rounded-none flex flex-col h-full">
            <h3 className="text-xl font-black mb-4">Trending Services</h3>
            <div className="grid grid-cols-2 gap-4 flex-1">
              {initialTrending?.filter(v => v && v.id).slice(0, 4).map((v) => (
                <Link key={v.id} href={`/marketplace/vendor/${v.id}`} className="group">
                  <div className="aspect-square relative mb-2 overflow-hidden bg-slate-100">
                    <Image
                      src={optimizeImage(v.coverImage, 'card')}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      alt={v.businessName || "Vendor"}
                    />
                  </div>
                  <p className="text-xs font-bold truncate">{v.businessName}</p>
                </Link>
              ))}
              {(!initialTrending || initialTrending.length === 0) && Array(4).fill(0).map((_, i) => (
                <div key={i} className="aspect-square bg-slate-50 animate-pulse" />
              ))}
            </div>
            <Link href="/marketplace" className="text-blue-600 hover:text-orange-600 text-sm font-bold mt-4">Explore all</Link>
          </div>

          <div className="bg-white p-6 shadow-md rounded-none">
            <h3 className="text-xl font-black mb-4">Plan Your Event</h3>
            <div className="space-y-4">
              <Link href="/marketplace" className="block relative aspect-[4/3] group overflow-hidden">
                <Image src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=800" fill className="object-cover group-hover:scale-105 transition-transform" alt="Plan" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="absolute bottom-4 left-4">
                   <span className="bg-white px-3 py-1 text-xs font-black uppercase tracking-widest shadow-lg">Start Now</span>
                </div>
              </Link>
              <div className="grid grid-cols-2 gap-4">
                 <Link href="/login" className="bg-yellow-400 hover:bg-yellow-500 py-2 text-center text-sm font-black rounded-lg shadow-sm">Sign In</Link>
                 <Link href="/vendor/register" className="bg-slate-900 text-white hover:bg-slate-800 py-2 text-center text-sm font-black rounded-lg shadow-sm">Join as Vendor</Link>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 shadow-md rounded-none">
             <h3 className="text-xl font-black mb-4">Quick Links</h3>
             <div className="grid grid-cols-2 gap-2">
                {initialEventTypes.slice(0, 6).map(type => (
                  <Link key={type.id} href={`/marketplace?eventTypeId=${type.id}`} className="bg-slate-50 hover:bg-slate-100 p-3 text-center rounded-xl border border-slate-100 transition-colors">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{type.name}</span>
                  </Link>
                ))}
                {initialEventTypes.length === 0 && Array(6).fill(0).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-50 animate-pulse rounded-xl" />
                ))}
             </div>
          </div>
        </div>

        {/* Recently Viewed (Level 7) */}
        <div className="shadow-md">
          <RecentlyViewed />
        </div>

        {/* Horizontal Scroll Sections (Amazon-style) */}
        {initialFeatured.length > 0 && (
          <section className="bg-white p-6 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black tracking-tight">FEATURED PROFESSIONALS</h2>
              <Link href="/marketplace" className="text-blue-600 hover:text-orange-600 text-sm font-bold">See all</Link>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
              {initialFeatured?.filter(v => v && v.id).map((vendor) => (
                <Link key={vendor.id} href={`/marketplace/vendor/${vendor.id}`} className="min-w-[200px] group">
                  <div className="aspect-square relative mb-3 rounded-xl overflow-hidden shadow-sm transition-all group-hover:shadow-md">
                    <Image
                      src={optimizeImage(vendor.coverImage, 'card')}
                      fill
                      className="object-cover"
                      alt={vendor.businessName || "Vendor"}
                    />
                    {vendor.verificationStatus === "APPROVED" && (
                      <div className="absolute top-2 right-2">
                        <ShieldCheck className="h-5 w-5 text-blue-500 fill-white" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-sm truncate">{vendor.businessName}</h4>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
                    <span className="text-xs font-bold">{vendor.rating || 0}</span>
                    <span className="text-[10px] text-slate-400 font-bold ml-1">({vendor.reviewCount || 0})</span>
                  </div>
                  <p className="text-lg font-black mt-1">₹{Number(vendor.basePrice || 0).toLocaleString()}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Categories Bar (Level 7) */}
        {initialEventTypes.length > 0 && (
          <section className="bg-white p-8 shadow-md">
            <h2 className="text-2xl font-black tracking-tight mb-8 uppercase text-center">Popular Event Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
                {initialEventTypes.map(type => (
                  <Link key={type.id} href={`/marketplace?eventTypeId=${type.id}`} className="group flex flex-col items-center">
                    <div className="h-24 w-24 rounded-full bg-slate-50 border-2 border-slate-100 flex items-center justify-center mb-4 group-hover:border-purple-600 transition-all shadow-sm relative overflow-hidden p-4">
                        { (type.image || EVENT_TYPE_ICONS[type.icon?.toLowerCase()]) ? (
                          <Image
                            src={type.image || EVENT_TYPE_ICONS[type.icon?.toLowerCase()] || eventIcon}
                            fill
                            className="p-6 opacity-70 group-hover:opacity-100 transition-opacity object-contain"
                            alt={type.name}
                          />
                        ) : (
                          <Sparkles className="h-10 w-10 text-purple-600" />
                        )}
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-slate-900 group-hover:text-purple-600 transition-colors">{type.name}</span>
                  </Link>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

