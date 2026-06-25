"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { useQuery } from "@tanstack/react-query";
import { useLocationStore } from "@/store/locationStore";
import dynamic from 'next/dynamic';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Link from "next/link";
import { Star, ArrowRight, ShieldCheck, Zap, Heart, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/apiClient";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const slides = [
  {
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069",
    title: "Plan Your Perfect Wedding",
    subtitle: "Discover elite decorators and venues for your big day.",
    cta: "Explore Wedding Services",
    link: "/marketplace?category=Wedding"
  },
  {
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=2069",
    title: "Professional Corporate Events",
    subtitle: "High-end catering and seamless planning for businesses.",
    cta: "Corporate Packages",
    link: "/marketplace?category=Corporate%20Events"
  },
  {
    image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=2070",
    title: "Unforgettable Birthday Bashes",
    subtitle: "Book DJs, entertainers, and theme decorators.",
    cta: "Birthday Special",
    link: "/marketplace?category=Birthday%20Party"
  }
];

const serviceCards = [
  {
    title: "Wedding Essentials",
    items: [
      { name: "Decor", image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400", link: "/marketplace?category=Decoration" },
      { name: "Venues", image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400", link: "/marketplace?category=Venues" },
      { name: "Catering", image: "https://images.unsplash.com/photo-1555244162-803834f70033?w=400", link: "/marketplace?category=Catering" },
      { name: "Photo", image: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400", link: "/marketplace?category=Photography" }
    ],
    cta: "See all wedding services"
  },
  {
    title: "Trending Categories",
    items: [
      { name: "Makeup", image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400", link: "/marketplace?category=Makeup" },
      { name: "DJ/Music", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400", link: "/marketplace?category=Music" },
      { name: "Travel", image: "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=400", link: "/marketplace?category=Travel" },
      { name: "Invitations", image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=400", link: "/marketplace?category=Invitations" }
    ],
    cta: "Explore all categories"
  },
  {
    title: "Host Like a Pro",
    items: [
      { name: "Planning", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400", link: "/marketplace?category=Planning" },
      { name: "Staffing", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400", link: "/marketplace?category=Staffing" },
      { name: "Tech/AV", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400", link: "/marketplace?category=AV" },
      { name: "Rentals", image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400", link: "/marketplace?category=Rentals" }
    ],
    cta: "Find event support"
  },
  {
    title: "Party Entertainment",
    items: [
      { name: "Live Band", image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400", link: "/marketplace?category=Live%20Band" },
      { name: "Magician", image: "https://images.unsplash.com/photo-1517457373958-b7bdd458ad20?w=400", link: "/marketplace?category=Magician" },
      { name: "Dancers", image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400", link: "/marketplace?category=Dancers" },
      { name: "Anchors", image: "https://images.unsplash.com/photo-1475721027187-4024733923f9?w=400", link: "/marketplace?category=Anchors" }
    ],
    cta: "Book entertainers"
  }
];

export default function HomeClient() {
  const { city } = useLocationStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const { data: featuredVendors } = useQuery({
    queryKey: ["featured-vendors", city],
    queryFn: async () => {
      const res = await apiClient.get(`/marketplace?featured=true&city=${city}&limit=12`);
      return res.data.vendors || [];
    },
    enabled: !!city,
  });

  const { data: trendingServices } = useQuery({
    queryKey: ["trending-services"],
    queryFn: async () => {
      const res = await apiClient.get(`/marketplace?sort=popularity&limit=12`);
      return res.data.vendors || [];
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-1 w-full pb-12">
        {/* HERO SLIDER SECTION */}
        <section className="relative w-full h-[300px] md:h-[600px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <Image
                src={slides[currentSlide].image}
                alt={slides[currentSlide].title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#F8FAFC] z-10" />
            </motion.div>
          </AnimatePresence>

          {/* Slider Controls */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-all"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-all"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </section>

        {/* AMAZON-STYLE SERVICE CARDS OVERLAY */}
        <section className="max-w-[1500px] mx-auto px-4 lg:px-6 -mt-20 md:-mt-64 relative z-30">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviceCards.map((card, idx) => (
              <div key={idx} className="bg-white p-5 rounded-sm shadow-sm flex flex-col h-full">
                <h2 className="text-[21px] font-bold text-[#111827] mb-3 leading-tight">{card.title}</h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-6 flex-1">
                  {card.items.map((item, i) => (
                    <Link key={i} href={item.link} className="group">
                      <div className="relative aspect-square overflow-hidden mb-1">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:opacity-90 transition-opacity"
                        />
                      </div>
                      <p className="text-[12px] font-semibold text-gray-700 group-hover:text-[#6D28D9]">{item.name}</p>
                    </Link>
                  ))}
                </div>
                <Link href="/marketplace" className="mt-4 text-[13px] font-semibold text-blue-600 hover:text-orange-600 transition-colors">
                  {card.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* RECENTLY VIEWED / CONTINUE BROWSING CAROUSEL */}
        <section className="max-w-[1500px] mx-auto px-4 lg:px-6 mt-8">
           <div className="bg-white p-5 rounded-sm shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-[21px] font-bold text-[#111827]">Recommended for You</h2>
                 <Link href="/marketplace" className="text-sm font-semibold text-blue-600 hover:underline">See all</Link>
              </div>
              <ScrollArea className="w-full whitespace-nowrap">
                 <div className="flex gap-4 pb-4">
                    {featuredVendors?.map((vendor: any) => (
                       <Link key={vendor.id} href={`/marketplace/vendor/${vendor.id}`} className="w-[180px] group inline-block">
                          <div className="relative aspect-square mb-2 overflow-hidden rounded-md border border-gray-100">
                             <Image
                               src={vendor.coverImage || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800"}
                               alt={vendor.businessName}
                               fill
                               className="object-cover group-hover:scale-105 transition-transform"
                             />
                          </div>
                          <p className="text-[14px] font-bold text-[#111827] truncate mb-0.5">{vendor.businessName}</p>
                          <div className="flex items-center gap-1 mb-1">
                             <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                   <Star key={i} className={`h-3 w-3 ${i < Math.floor(vendor.rating || 4.5) ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-gray-200'}`} />
                                ))}
                             </div>
                             <span className="text-[12px] text-blue-600 font-bold">{vendor.reviewCount || 0}</span>
                          </div>
                          <p className="text-[16px] font-bold text-[#111827]">
                             ₹{vendor.basePrice?.toLocaleString()} <span className="text-[12px] text-gray-500 font-normal">base price</span>
                          </p>
                       </Link>
                    ))}
                 </div>
                 <ScrollBar orientation="horizontal" />
              </ScrollArea>
           </div>
        </section>

        {/* OFFERS BANNER */}
        <section className="max-w-[1500px] mx-auto px-4 lg:px-6 mt-8">
           <Link href="/marketplace?onSale=true">
              <div className="relative w-full h-[120px] md:h-[200px] rounded-sm overflow-hidden shadow-sm">
                 <Image
                   src="https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?w=1600"
                   alt="Offers"
                   fill
                   className="object-cover"
                 />
                 <div className="absolute inset-0 bg-black/40 flex flex-col justify-center px-8 text-white">
                    <h2 className="text-2xl md:text-4xl font-black mb-2 tracking-tight">UP TO 30% OFF ON LUXURY VENUES</h2>
                    <p className="text-sm md:text-lg font-bold">Limited time offer for bookings this wedding season.</p>
                 </div>
              </div>
           </Link>
        </section>

        {/* TRENDING SERVICES GRID */}
        <section className="max-w-[1500px] mx-auto px-4 lg:px-6 mt-8">
           <div className="bg-white p-5 rounded-sm shadow-sm">
              <h2 className="text-[21px] font-bold text-[#111827] mb-6">Trending Services in {city || "India"}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                 {trendingServices?.slice(0, 12).map((vendor: any) => (
                    <Link key={vendor.id} href={`/marketplace/vendor/${vendor.id}`} className="group flex flex-col">
                       <div className="relative aspect-[4/5] rounded-lg overflow-hidden mb-3 border border-gray-100 shadow-sm">
                          <Image
                            src={vendor.coverImage || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800"}
                            alt={vendor.businessName}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute top-2 left-2">
                             <Badge className="bg-[#10B981] text-white border-none text-[10px] font-black uppercase">Verified</Badge>
                          </div>
                       </div>
                       <h3 className="font-bold text-[#111827] truncate text-[14px] mb-1 leading-tight">{vendor.businessName}</h3>
                       <div className="flex items-center gap-1.5 mb-2">
                          <Star className="h-3 w-3 fill-[#F59E0B] text-[#F59E0B]" />
                          <span className="text-[12px] font-bold text-gray-700">{vendor.rating || "4.8"}</span>
                          <span className="text-[11px] text-gray-400 font-medium">({vendor.reviewCount || "24"})</span>
                       </div>
                       <p className="mt-auto font-bold text-[#6D28D9] text-[15px]">From ₹{vendor.basePrice?.toLocaleString()}</p>
                    </Link>
                 ))}
              </div>
           </div>
        </section>

        {/* POPULAR CATEGORIES - LARGE VISUAL CARDS */}
        <section className="max-w-[1500px] mx-auto px-4 lg:px-6 mt-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: "Dream Weddings", img: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800", count: "1,200+ Vendors" },
                { name: "Corporate Galas", img: "https://images.unsplash.com/photo-1475721027187-4024733923f9?w=800", count: "800+ Vendors" },
                { name: "Private Parties", img: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800", count: "2,500+ Vendors" }
              ].map((cat, idx) => (
                <div key={idx} className="relative h-[250px] rounded-lg overflow-hidden group shadow-sm border border-gray-100">
                   <Image src={cat.img} alt={cat.name} fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
                      <h3 className="text-xl font-black text-white mb-1">{cat.name}</h3>
                      <p className="text-white/80 text-sm font-bold mb-4">{cat.count}</p>
                      <Button className="w-fit bg-white text-black hover:bg-gray-100 font-bold rounded-full h-8 px-6 text-xs transition-all">
                        Explore
                      </Button>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* CUSTOMER REVIEWS SECTION */}
        <section className="max-w-[1500px] mx-auto px-4 lg:px-6 mt-12 py-12 bg-white rounded-sm shadow-sm border border-gray-100">
           <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-[#111827] tracking-tight">Trusted by thousands of event hosts</h2>
              <div className="flex justify-center mt-4">
                 <div className="h-1.5 w-24 bg-[#6D28D9] rounded-full" />
              </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: "Ananya Sharma", role: "Wedding Host", comment: "Mana Event made finding my wedding decorator so easy. The verified badge gave me a lot of confidence.", rating: 5 },
                { name: "Vikram Mehta", role: "Corporate HR", comment: "Excellent service for our annual day. The catering was top-notch and the coordination was seamless.", rating: 5 },
                { name: "Rahul Deshpande", role: "Birthday Planner", comment: "Great platform with a wide variety of entertainers. Highly recommended for any event type.", rating: 4 }
              ].map((review, i) => (
                <div key={i} className="bg-[#F8FAFC] p-8 rounded-2xl border border-gray-100 relative">
                   <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                         <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-gray-300'}`} />
                      ))}
                   </div>
                   <p className="text-gray-700 italic font-medium leading-relaxed mb-6">"{review.comment}"</p>
                   <div>
                      <h4 className="font-bold text-[#111827]">{review.name}</h4>
                      <p className="text-xs font-bold text-[#6D28D9] uppercase tracking-widest">{review.role}</p>
                   </div>
                </div>
              ))}
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium", className)}>
      {children}
    </span>
  );
}
