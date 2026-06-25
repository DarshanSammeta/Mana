"use client";

import Navbar from "@/components/common/Navbar";
import { Star, Check, X, ShieldCheck, Zap, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ComparePage() {
  const vendors = [
    {
      id: 1,
      name: "Lumina Photography",
      price: "45,000",
      rating: "4.9",
      reviews: "128",
      features: ["Full Day Coverage", "4K Video", "Drone Shots", "Candid Expert", "Express Delivery"],
      availability: "Limited",
      response: "1h"
    },
    {
      id: 2,
      name: "Grand Moments",
      price: "38,000",
      rating: "4.7",
      reviews: "95",
      features: ["8 Hours Coverage", "Full HD Video", "Traditional Focus", "Next Day Preview"],
      availability: "Available",
      response: "4h"
    },
    {
      id: 3,
      name: "Eternal Frames",
      price: "65,000",
      rating: "5.0",
      reviews: "210",
      features: ["Unlimited Coverage", "Cinema 8K", "Dual Photographers", "Premium Album", "Global Travel"],
      availability: "Filling Fast",
      response: "30m"
    }
  ];

  const allFeatures = [
    "Full Day Coverage",
    "4K Video",
    "Drone Shots",
    "Candid Expert",
    "Express Delivery",
    "Premium Album",
    "Dual Photographers"
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="container mx-auto px-4 py-16">
        <div className="mb-12">
           <h1 className="text-4xl font-black mb-2">Compare Professionals</h1>
           <p className="text-slate-500 font-bold">Side-by-side analysis of your shortlisted vendors</p>
        </div>

        <div className="overflow-x-auto pb-10">
          <div className="min-w-[1000px]">
            <table className="w-full border-separate border-spacing-x-4">
               <thead>
                  <tr>
                    <th className="w-1/4"></th>
                    {vendors.map(v => (
                      <th key={v.id} className="w-1/4 pb-10">
                         <Card className="p-6 rounded-[2rem] border-none shadow-xl bg-white text-left relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center font-black text-2xl text-primary mb-4 group-hover:scale-110 transition-transform">
                               {v.name.charAt(0)}
                            </div>
                            <h3 className="text-xl font-black mb-1 leading-tight">{v.name}</h3>
                            <div className="flex items-center gap-1 text-xs font-bold text-amber-500 mb-6">
                               <Star className="h-3 w-3 fill-amber-500" />
                               {v.rating} ({v.reviews} reviews)
                            </div>
                            <Button variant="premium" className="w-full rounded-xl font-black">Book Now</Button>
                         </Card>
                      </th>
                    ))}
                  </tr>
               </thead>
               <tbody className="bg-white rounded-[2.5rem] shadow-sm">
                  {/* Price Row */}
                  <tr className="border-b">
                     <td className="p-8 text-sm font-black text-slate-400 uppercase tracking-widest">Starting Price</td>
                     {vendors.map(v => (
                       <td key={v.id} className="p-8 text-2xl font-black text-slate-900">₹{v.price}</td>
                     ))}
                  </tr>

                  {/* Response Row */}
                  <tr className="bg-slate-50/50">
                     <td className="p-8 text-sm font-black text-slate-400 uppercase tracking-widest">Response Time</td>
                     {vendors.map(v => (
                       <td key={v.id} className="p-8">
                          <Badge variant="outline" className="rounded-full px-4 border-slate-200 font-bold">
                             Under {v.response}
                          </Badge>
                       </td>
                     ))}
                  </tr>

                  {/* Features */}
                  {allFeatures.map((f, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "" : "bg-slate-50/50"}>
                       <td className="p-8 text-sm font-bold text-slate-600">{f}</td>
                       {vendors.map(v => (
                         <td key={v.id} className="p-8 text-center">
                            {v.features.includes(f) ? (
                              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                 <Check className="h-5 w-5 text-green-600" />
                              </div>
                            ) : (
                              <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center mx-auto opacity-30">
                                 <X className="h-4 w-4 text-slate-400" />
                              </div>
                            )}
                         </td>
                       ))}
                    </tr>
                  ))}

                  {/* Availability */}
                  <tr className="border-t">
                     <td className="p-8 text-sm font-black text-slate-400 uppercase tracking-widest">Availability</td>
                     {vendors.map(v => (
                       <td key={v.id} className="p-8">
                          <div className="flex items-center gap-2 font-black text-sm text-slate-700">
                             <div className={`h-2.5 w-2.5 rounded-full ${v.availability === 'Available' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
                             {v.availability}
                          </div>
                       </td>
                     ))}
                  </tr>
               </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
