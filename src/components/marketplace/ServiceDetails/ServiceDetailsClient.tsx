"use client";

import { memo, useState, useEffect } from "react";
import {
  Star,
  ShieldCheck,
  Heart,
  ChevronRight,
  Share2,
  Award,
  Zap,
  Clock,
  ThumbsUp
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ServiceGallery } from "./ServiceGallery";
import { ServicePurchaseBox } from "./ServicePurchaseBox";
import PackageIncludes from "./PackageIncludes";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCommerceStore } from "@/store/commerceStore";
import { useToggleWishlist } from "@/hooks/use-commerce";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { ServiceCard } from "@/components/marketplace/ServiceCard";

interface ServiceDetailsClientProps {
  service: any;
  relatedServices: any[];
  vendorServices: any[];
}

function ServiceDetailsClient({ service, relatedServices, vendorServices }: ServiceDetailsClientProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string>(service.Renamedpackage?.[0]?.id || "");
  const { wishlist } = useCommerceStore();
  const { trackView } = useRecentlyViewed();
  const { mutate: toggleWishlistApi } = useToggleWishlist();

  useEffect(() => {
    setIsMounted(true);
    if (service) {
      // Logic to track view for this specific service
      trackView({
          id: service.id,
          businessName: service.vendorprofile.businessName,
          coverImage: service.portfolio?.[0]?.mediaUrl || service.vendorprofile.coverImage,
          basePrice: service.basePrice
      });
    }
  }, [service, trackView]);

  const isWishlisted = isMounted && wishlist.some(i => i.targetId === service.id);
  const images = service.portfolio?.map((p: any) => p.mediaUrl) || [];

  const selectedPackage = service.Renamedpackage?.find((p: any) => p.id === selectedPackageId) || null;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-20">

      {/* Breadcrumbs (Amazon Style) */}
      <nav className="max-w-[1500px] mx-auto px-4 lg:px-6 py-3 flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-tight">
        <Link href="/marketplace" className="hover:text-primary transition-colors">Marketplace</Link>
        <ChevronRight className="h-3 w-3 text-slate-300" />
        <span className="text-slate-400">{service.servicetype?.subcategory?.category?.name}</span>
        <ChevronRight className="h-3 w-3 text-slate-300" />
        <span className="text-slate-900 font-black truncate">{service.title}</span>
      </nav>

      <main className="max-w-[1500px] mx-auto w-full px-4 lg:px-6 mt-4">

        {/* Top Product Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* Gallery - Col Span 5 */}
          <div className="lg:col-span-5">
            <ServiceGallery images={images} title={service.title} />
          </div>

          {/* Core Info - Col Span 4 */}
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Link
                    href={`/marketplace/vendor/${service.vendorprofile.id}`}
                    className="text-sm font-black text-primary hover:underline uppercase tracking-wider"
                >
                    Visit the {service.vendorprofile.businessName} Store
                </Link>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-slate-100 rounded-full transition-colors"><Share2 className="h-4 w-4 text-slate-400" /></button>
                    <button
                        onClick={() => toggleWishlistApi({ type: 'SERVICE', targetId: service.id })}
                        className={cn("p-2 hover:bg-slate-100 rounded-full transition-colors", isWishlisted ? "text-red-500" : "text-slate-400")}
                    >
                        <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
                    </button>
                </div>
              </div>
              <h1 className="text-3xl font-black tracking-tight leading-tight italic uppercase">{service.title}</h1>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                    <span className="text-xs font-black text-orange-700">{service.rating || "4.8"}</span>
                    <div className="flex">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={cn("h-3 w-3", i < 4 ? "fill-orange-400 text-orange-400" : "text-slate-200")} />
                        ))}
                    </div>
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{service.reviewCount || 24} ratings</span>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">100+ Booked last month</span>
              </div>
            </div>

            <Separator />

            {/* Pricing Summary */}
            <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-[#B12704] uppercase tracking-widest">Deal</span>
                    <span className="text-3xl font-black text-slate-900">{formatCurrency(selectedPackage ? Number(selectedPackage.price) : Number(service.basePrice))}</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    Inclusive of basic equipment & travel within {service.vendorprofile.serviceRadius}km.
                </p>
            </div>

            <Separator />

            {/* Highlights */}
            <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Service Highlights</h3>
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { icon: Award, label: "Top Rated", sub: "Bestseller Category" },
                        { icon: Zap, label: "Fast Response", sub: "Under 2 hours" },
                        { icon: ShieldCheck, label: "Verified", sub: "Mana Background Checked" },
                        { icon: Clock, label: "Experience", sub: "5+ Years" },
                    ].map((item, i) => (
                        <div key={i} className="flex gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                                <item.icon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-tight">{item.label}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">{item.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Separator />

            {/* Short Specs / Summary Table */}
            <div className="space-y-3">
                 <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Technical Specs</h3>
                 <div className="grid grid-cols-2 gap-y-2 text-[11px] font-bold uppercase tracking-tight">
                    <span className="text-slate-400">Service Type</span>
                    <span className="text-slate-900">{service.servicetype.name}</span>
                    <span className="text-slate-400">Capacity</span>
                    <span className="text-slate-900">Up to 1000 Guests</span>
                    <span className="text-slate-400">Duration</span>
                    <span className="text-slate-900">4 - 6 Hours</span>
                    <span className="text-slate-400">Availability</span>
                    <span className="text-emerald-600 font-black">In Stock</span>
                 </div>
            </div>
          </div>

          {/* Sticky Purchase Box - Col Span 3 */}
          <div className="lg:col-span-3">
            <ServicePurchaseBox
                serviceId={service.id}
                vendorId={service.vendorprofile.id}
                vendorName={service.vendorprofile.businessName}
                serviceName={service.title}
                serviceImage={images[0]}
                city={service.vendorprofile.city}
                basePrice={Number(service.basePrice)}
                packages={service.Renamedpackage || []}
                selectedPackageId={selectedPackageId}
                onPackageSelect={setSelectedPackageId}
            />
          </div>
        </div>

        {/* Full-width Stacked Content */}
        <div className="mt-20 space-y-24">

            {/* Related Services */}
            {relatedServices.length > 0 && (
                <section className="space-y-8">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase italic">Related Services</h2>
                        <Separator className="flex-1" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {relatedServices.map((s: any, idx: number) => (
                            <ServiceCard
                                key={s.id}
                                index={idx}
                                service={{
                                    id: s.id,
                                    slug: s.title.toLowerCase().replace(/ /g, '-'),
                                    title: s.title,
                                    category: s.category || "Service",
                                    startingPrice: Number(s.basePrice || s.startingPrice),
                                    images: s.portfolio?.map((p: any) => p.mediaUrl) || [],
                                    rating: s.vendorprofile?.rating || 4.5,
                                    reviewCount: s.reviewCount || 10,
                                    vendor: {
                                        id: s.vendorprofile?.id,
                                        businessName: s.vendorprofile?.businessName,
                                        city: s.vendorprofile?.city,
                                        isVerified: true
                                    },
                                    badges: []
                                }}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Description Section */}
            <section className="max-w-4xl space-y-6">
                 <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase italic">From the Vendor</h2>
                    <Separator className="flex-1" />
                 </div>
                 <div className="prose prose-slate max-w-none">
                    <p className="text-slate-600 leading-relaxed font-medium text-lg italic border-l-4 border-primary pl-6">
                        {service.description}
                    </p>
                 </div>
            </section>

            {/* Package Details Section */}
            <section>
                <PackageIncludes selectedPackage={selectedPackage} />
            </section>

            {/* Reviews Section */}
            <section className="border-t border-slate-100 pt-20">
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4 space-y-6">
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase italic">Customer Reviews</h2>
                        <div className="flex items-center gap-4">
                            <span className="text-5xl font-black text-slate-900">4.8</span>
                            <div className="space-y-1">
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-orange-400 text-orange-400" />)}
                                </div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Global Ratings</p>
                            </div>
                        </div>
                        {/* Rating Bars Placeholder */}
                        <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map(r => (
                                <div key={r} className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-slate-500 w-12 uppercase">{r} star</span>
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-400" style={{ width: `${r === 5 ? 85 : r === 4 ? 10 : 5}%` }} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 w-8">{r === 5 ? 85 : r === 4 ? 10 : 5}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="lg:col-span-8">
                        <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-4">
                            <ThumbsUp className="h-10 w-10 text-slate-200" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Verified reviews will load here</p>
                            <Button variant="outline" className="rounded-xl font-black uppercase tracking-widest text-[10px]">Read all reviews</Button>
                        </div>
                    </div>
                 </div>
            </section>

            {/* Vendor Services */}
            {vendorServices.length > 0 && (
                <section className="space-y-8">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase italic">More From This Vendor</h2>
                        <Separator className="flex-1" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {vendorServices.map((s: any, idx: number) => (
                            <ServiceCard key={s.id} index={idx} service={s} />
                        ))}
                    </div>
                </section>
            )}
        </div>
      </main>
    </div>
  );
}

export default memo(ServiceDetailsClient);
