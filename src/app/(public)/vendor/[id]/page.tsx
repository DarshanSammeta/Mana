"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/common/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, MapPin, Calendar, Clock, Users, CheckCircle2, MessageSquare } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";

export default function VendorProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user } = useAuthStore();
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const res = await axios.get(`/api/marketplace/${id}`);
        setVendor(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 space-y-8">
            <div className="h-[400px] w-full rounded-[2.5rem] bg-muted animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="h-12 w-1/3 bg-muted animate-pulse rounded-xl" />
                    <div className="h-40 w-full bg-muted animate-pulse rounded-3xl" />
                </div>
                <div className="lg:col-span-1">
                    <div className="h-80 w-full bg-muted animate-pulse rounded-3xl" />
                </div>
            </div>
        </div>
    </div>
  );

  if (!vendor) return (
    <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
            <h1 className="text-2xl font-black">Vendor not found</h1>
            <Button className="mt-4" onClick={() => router.back()}>Go Back</Button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      {/* Premium Hero Header */}
      <div className="container mx-auto px-4 pt-8">
          <div className="h-[450px] w-full relative rounded-[2.5rem] overflow-hidden shadow-2xl">
            <img
            src={vendor.vendor.coverImage || "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop"}
            className="w-full h-full object-cover"
            alt={vendor.vendor.businessName}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

            <div className="absolute bottom-0 left-0 w-full p-10 text-white">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="flex gap-8 items-center">
                    <div className="h-32 w-32 rounded-3xl border-4 border-white/20 backdrop-blur-md bg-white/10 p-1 shadow-2xl">
                        <img
                            src={vendor.vendor.logo || "https://via.placeholder.com/150"}
                            alt="Logo"
                            className="w-full h-full object-cover rounded-2xl bg-white"
                        />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-primary/20 backdrop-blur-md text-primary-foreground text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-primary/30">
                                {vendor.vendor.category || "Verified Vendor"}
                            </span>
                            <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                                <Star className="h-4 w-4 fill-current" />
                                {vendor.vendor.review?.length > 0 ? (vendor.vendor.review.reduce((a:any, b:any) => a + b.rating, 0) / vendor.vendor.review.length).toFixed(1) : "5.0"}
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">{vendor.vendor.businessName}</h1>
                        <p className="flex items-center gap-2 text-slate-300 font-medium">
                            <MapPin className="h-4 w-4 text-primary" /> {vendor.vendor.city}, {vendor.vendor.state}
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" className="rounded-2xl h-14 px-8 border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 font-bold gap-2">
                        <Star className="h-5 w-5" /> Reviews
                    </Button>
                    <Button variant="premium" className="rounded-2xl h-14 px-8 font-black gap-2 shadow-xl shadow-primary/20">
                        <MessageSquare className="h-5 w-5" /> Message Now
                    </Button>
                </div>
                </div>
            </div>
          </div>
      </div>

      <div className="container mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-10">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b border-border/50 rounded-none h-auto p-0 mb-10 gap-8">
              <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-sm font-black uppercase tracking-widest text-muted-foreground data-[state=active]:text-primary transition-all">Overview</TabsTrigger>
              <TabsTrigger value="services" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-sm font-black uppercase tracking-widest text-muted-foreground data-[state=active]:text-primary transition-all">Services & Packages</TabsTrigger>
              <TabsTrigger value="portfolio" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-sm font-black uppercase tracking-widest text-muted-foreground data-[state=active]:text-primary transition-all">Portfolio</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-sm font-black uppercase tracking-widest text-muted-foreground data-[state=active]:text-primary transition-all">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-12 outline-none">
              <section>
                <h2 className="text-2xl font-black mb-6 italic flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                    ABOUT THE VENDOR
                </h2>
                <p className="text-muted-foreground leading-relaxed text-lg font-medium">{vendor.vendor.description || "Premium event service provider dedicated to making your celebrations unforgettable. With years of experience and a passion for excellence, we deliver results that exceed expectations."}</p>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-card border border-border/50 rounded-[2rem] shadow-sm group hover:shadow-xl transition-all">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Service Radius</p>
                    <p className="text-xl font-black">{vendor.vendor.serviceRadius || 20} km from {vendor.vendor.city}</p>
                    <div className="h-1.5 w-12 bg-primary/20 rounded-full mt-4 group-hover:w-20 transition-all" />
                  </div>
                  <div className="p-8 bg-card border border-border/50 rounded-[2rem] shadow-sm group hover:shadow-xl transition-all">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Experience</p>
                    <p className="text-xl font-black">5+ Years of Excellence</p>
                    <div className="h-1.5 w-12 bg-primary/20 rounded-full mt-4 group-hover:w-20 transition-all" />
                  </div>
              </section>
            </TabsContent>

            <TabsContent value="services" className="space-y-8 outline-none">
              {vendor.vendor.service?.map((service: any) => (
                <div key={service.id} className="rounded-[2.5rem] border border-border/50 bg-card overflow-hidden shadow-sm">
                  <div className="p-10 border-b border-border/50 bg-secondary/30">
                    <h3 className="text-2xl font-black mb-2">{service.title}</h3>
                    <p className="text-muted-foreground font-medium">{service.description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-border/50">
                    {service.Renamedpackage?.map((pkg: any) => (
                      <div key={pkg.id} className="p-8 space-y-6 hover:bg-secondary/20 transition-colors flex flex-col">
                        <div className="text-center">
                          <h4 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">{pkg.name}</h4>
                          <div className="flex items-center justify-center gap-1">
                              <span className="text-sm font-bold text-muted-foreground mt-1">₹</span>
                              <span className="text-3xl font-black text-foreground">{pkg.price}</span>
                          </div>
                        </div>
                        <ul className="space-y-3 flex-1">
                          {pkg.inclusions?.map((inc: string, idx: number) => (
                            <li key={idx} className="text-xs font-bold text-muted-foreground flex items-start gap-3">
                              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                              <span className="leading-tight">{inc}</span>
                            </li>
                          ))}
                        </ul>
                        <Button
                            className="w-full rounded-2xl font-black shadow-lg shadow-black/5"
                            variant="premium"
                            onClick={() => router.push(`/customer/checkout?vendorId=${vendor.vendor.id}&serviceId=${service.id}&packageId=${pkg.id}`)}
                        >
                            Select Package
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sticky Booking Widget */}
        <div className="lg:col-span-1">
          <div className="sticky top-32 space-y-8">
            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-black/10 overflow-hidden">
              <div className="bg-primary p-6 text-white text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Starting From</p>
                  <p className="text-4xl font-black">₹ {vendor.vendor.service?.[0]?.basePrice || "0"}</p>
              </div>
              <CardContent className="p-10 space-y-8 bg-card">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Event Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                        <input type="date" className="w-full h-14 pl-12 pr-4 bg-secondary/50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Guest Count</label>
                    <div className="relative">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                        <input type="number" placeholder="How many guests?" className="w-full h-14 pl-12 pr-4 bg-secondary/50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all outline-none font-bold text-sm" />
                    </div>
                  </div>
                </div>

                <Button className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-primary/20" variant="premium">
                    Reserve Your Date
                </Button>

                <div className="flex flex-col items-center gap-2">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter flex items-center gap-2">
                        <Clock className="h-3 w-3" /> No payment charged yet
                    </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-none bg-card p-2 shadow-lg">
              <CardContent className="p-8">
                <h4 className="font-black text-lg mb-6 flex items-center gap-2 italic">
                    <MapPin className="h-5 w-5 text-primary" />
                    LOCATION
                </h4>
                <div className="aspect-video bg-secondary/50 rounded-3xl flex flex-col items-center justify-center border border-dashed border-border p-6 text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground px-4 leading-relaxed">Interactive maps coming soon for this vendor</p>
                </div>
                <p className="mt-6 text-sm font-bold text-muted-foreground leading-relaxed">{vendor.vendor.address || "Hyderabad, Telangana, India"}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
