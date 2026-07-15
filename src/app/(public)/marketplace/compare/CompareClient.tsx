"use client";

import { Star, Check, X, ArrowLeft, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCompareStore } from "@/store/useCompareStore";
import Link from "next/link";
import Image from "next/image";
import { optimizeImage } from "@/lib/cloudinary";

export default function CompareClient({
  initialEventTypes: _initialEventTypes,
  initialCategories: _initialCategories
}: {
  initialEventTypes: any[],
  initialCategories: any[]
}) {
  const { vendors, removeVendor, clearCompare } = useCompareStore();

  const allFeatures = [
    "Full Day Coverage",
    "4K Video",
    "Drone Shots",
    "Candid Expert",
    "Express Delivery",
    "Premium Album",
    "Dual Photographers",
    "Travel Included",
    "Raw Footage"
  ];

  if (vendors.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="container mx-auto px-4 py-32 text-center">
           <div className="h-24 w-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-8">
              <Star className="h-10 w-10 text-slate-200" />
           </div>
           <h1 className="text-4xl font-black mb-4 tracking-tighter">No vendors to compare</h1>
           <p className="text-slate-500 font-bold mb-10 max-w-md mx-auto">Add some event professionals from the marketplace to start comparing them side-by-side.</p>
           <Link href="/marketplace">
              <Button className="bg-[#111827] text-white px-10 h-14 rounded-2xl font-black uppercase tracking-widest text-xs">
                 Back to Marketplace
              </Button>
           </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-16">
           <div>
              <Link href="/marketplace" className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest mb-4 hover:gap-3 transition-all">
                 <ArrowLeft className="h-4 w-4" />
                 Back to Search
              </Link>
              <h1 className="text-5xl font-black mb-2 tracking-tighter">Compare Results</h1>
              <p className="text-slate-500 font-bold">Analysis of your {vendors.length} selected professionals</p>
           </div>
           <Button
             variant="outline"
             onClick={clearCompare}
             className="rounded-xl border-slate-200 text-slate-500 font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
           >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
           </Button>
        </div>

        <div className="overflow-x-auto pb-10">
          <div className="min-w-[1000px]">
            <table className="w-full border-separate border-spacing-x-4">
               <thead>
                  <tr>
                    <th className="w-1/4"></th>
                    {vendors.map(v => (
                      <th key={v.id} className="w-1/4 pb-10">
                         <Card className="p-6 rounded-[2.5rem] border-none shadow-2xl bg-white text-left relative overflow-hidden group">
                            <button
                              onClick={() => removeVendor(v.id)}
                              className="absolute top-4 right-4 h-8 w-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all z-10"
                            >
                               <X className="h-4 w-4" />
                            </button>
                            <div className="h-48 w-full rounded-2xl overflow-hidden mb-6 relative">
                               <Image
                                 src={optimizeImage(v.coverImage, 'card') || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800"}
                                 fill
                                 className="object-cover group-hover:scale-110 transition-transform duration-700"
                                 alt={v.businessName}
                               />
                            </div>
                            <div className="px-2">
                               <Badge className="bg-blue-50 text-blue-600 border-blue-100 mb-3 font-black text-[10px] uppercase tracking-widest">{v.category || "Professional"}</Badge>
                               <h3 className="text-xl font-black mb-1 leading-tight line-clamp-1">{v.businessName}</h3>
                               <div className="flex items-center gap-1.5 text-xs font-black text-amber-500 mb-6 uppercase tracking-wider">
                                  <Star className="h-3.5 w-3.5 fill-amber-500" />
                                  {v.rating} <span className="text-slate-300 ml-1">/ 5.0</span>
                               </div>
                               <Link href={`/marketplace/vendor/${v.id}`}>
                                  <Button className="w-full bg-[#111827] text-white rounded-xl h-12 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-slate-200">View Profile</Button>
                               </Link>
                            </div>
                         </Card>
                      </th>
                    ))}
                    {vendors.length < 4 && (
                      <th className="w-1/4 pb-10">
                         <Link href="/marketplace">
                           <div className="h-full border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center p-10 hover:border-blue-400 hover:bg-blue-50/50 transition-all group min-h-[400px]">
                              <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                 <Plus className="h-8 w-8 text-slate-400 group-hover:text-blue-500" />
                              </div>
                              <p className="font-black text-slate-400 uppercase tracking-widest text-xs group-hover:text-blue-600">Add Professional</p>
                           </div>
                         </Link>
                      </th>
                    )}
                  </tr>
               </thead>
               <tbody className="bg-white rounded-[3rem] shadow-sm border border-slate-100">
                  {/* Price Row */}
                  <tr className="border-b border-slate-50">
                     <td className="p-10 text-[11px] font-black text-slate-400 uppercase tracking-widest">Starting Price</td>
                     {vendors.map(v => (
                       <td key={v.id} className="p-10">
                          <div className="flex flex-col">
                             <span className="text-3xl font-black text-slate-900">₹{v.basePrice.toLocaleString()}</span>
                             <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Avg. per event</span>
                          </div>
                       </td>
                     ))}
                     {vendors.length < 4 && <td className="p-10"></td>}
                  </tr>

                  {/* Location Row */}
                  <tr className="bg-slate-50/50">
                     <td className="p-10 text-[11px] font-black text-slate-400 uppercase tracking-widest">Base Location</td>
                     {vendors.map(v => (
                       <td key={v.id} className="p-10">
                          <div className="flex items-center gap-2 font-black text-slate-700">
                             <MapPin className="h-4 w-4 text-blue-500" />
                             {v.city}
                          </div>
                       </td>
                     ))}
                     {vendors.length < 4 && <td className="p-10"></td>}
                  </tr>

                  {/* Booking Status */}
                  <tr>
                     <td className="p-10 text-[11px] font-black text-slate-400 uppercase tracking-widest">Availability</td>
                     {vendors.map(v => (
                       <td key={v.id} className="p-10">
                          <div className="flex items-center gap-2 font-black text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full w-fit">
                             <Calendar className="h-4 w-4" />
                             Check Calendar
                          </div>
                       </td>
                     ))}
                     {vendors.length < 4 && <td className="p-10"></td>}
                  </tr>

                  {/* Features */}
                  <tr className="bg-slate-900">
                     <td colSpan={vendors.length + 1 + (vendors.length < 4 ? 1 : 0)} className="px-10 py-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Service Features Analysis</span>
                     </td>
                  </tr>

                  {allFeatures.map((f, idx) => (
                    <tr key={idx} className="border-b border-slate-50">
                       <td className="p-10 text-sm font-bold text-slate-600">{f}</td>
                       {vendors.map(v => (
                         <td key={v.id} className="p-10">
                            {/* In a real app, this would check vendor.features */}
                            {Math.random() > 0.4 ? (
                              <div className="h-10 w-10 bg-emerald-100 rounded-2xl flex items-center justify-center">
                                 <Check className="h-6 w-6 text-emerald-600" />
                              </div>
                            ) : (
                              <div className="h-10 w-10 bg-slate-50 rounded-2xl flex items-center justify-center opacity-30">
                                 <X className="h-5 w-5 text-slate-400" />
                              </div>
                            )}
                         </td>
                       ))}
                       {vendors.length < 4 && <td className="p-10"></td>}
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

import { MapPin, Plus } from "lucide-react";
