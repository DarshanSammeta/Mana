"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Home,
  Briefcase,
  User,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now as the schema doesn't have a dedicated Address model yet,
    // but users usually have multiple addresses in Amazon-style dashboards.
    // We can simulate this using a JSON field in User or a new model.
    setTimeout(() => {
      setAddresses([
        {
          id: '1',
          name: 'Home',
          type: 'HOME',
          fullName: 'John Doe',
          addressLine: 'Flat 402, Green Valley Apartments',
          landmark: 'Near Central Park',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          mobile: '9876543210',
          isDefault: true
        },
        {
          id: '2',
          name: 'Office',
          type: 'WORK',
          fullName: 'John Doe',
          addressLine: 'Level 12, Tech Hub Tower',
          landmark: 'BKC',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400051',
          mobile: '9876543210',
          isDefault: false
        }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'HOME': return Home;
      case 'WORK': return Briefcase;
      default: return User;
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Addresses</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage saved locations for your event bookings.</p>
        </div>
        <Button className="bg-primary hover:bg-blue-700 text-white font-extrabold rounded-2xl px-8 h-12 shadow-lg shadow-primary/20">
          <Plus className="h-5 w-5 mr-2" />
          ADD NEW ADDRESS
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-56 w-full rounded-3xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Add New Address Card */}
          <button className="border-2 border-dashed border-slate-200 rounded-[2rem] p-8 flex flex-col items-center justify-center text-slate-400 hover:text-primary hover:border-primary/50 hover:bg-blue-50/50 transition-all group min-h-[240px]">
             <div className="h-16 w-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-white shadow-sm transition-all group-hover:scale-110">
                <Plus className="h-8 w-8" />
             </div>
             <p className="font-black text-sm uppercase tracking-widest">Add New Address</p>
          </button>

          {addresses.map((address) => {
            const Icon = getIcon(address.type);
            return (
              <div
                key={address.id}
                className={cn(
                  "border rounded-[2rem] p-8 relative transition-all bg-white min-h-[240px] flex flex-col group",
                  address.isDefault ? "border-primary shadow-xl shadow-primary/5 ring-1 ring-primary/20" : "border-slate-200 hover:border-primary/30 hover:shadow-lg"
                )}
              >
                {address.isDefault && (
                  <div className="absolute top-0 right-8 -translate-y-1/2 bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-primary/20">
                    Default
                  </div>
                )}

                <div className="flex items-center gap-4 mb-6">
                   <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors",
                      address.isDefault ? "bg-primary text-white" : "bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-primary"
                   )}>
                      <Icon className="h-6 w-6" />
                   </div>
                   <h3 className="font-extrabold text-slate-900 text-lg">{address.name}</h3>
                </div>

                <div className="space-y-1.5 flex-1">
                   <p className="text-sm font-black text-slate-900">{address.fullName}</p>
                   <p className="text-sm text-slate-500 font-medium leading-relaxed">
                     {address.addressLine}, {address.landmark}<br />
                     {address.city}, {address.state} - {address.pincode}
                   </p>
                   <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
                      <span className="uppercase tracking-widest text-[10px]">Mobile:</span>
                      <span className="text-slate-700">{address.mobile}</span>
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-6">
                   <button className="text-xs font-black text-primary hover:text-blue-700 flex items-center gap-2 transition-colors uppercase tracking-widest">
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                   </button>
                   <button className="text-xs font-black text-slate-400 hover:text-rose-600 flex items-center gap-2 transition-colors uppercase tracking-widest">
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                   </button>
                   {!address.isDefault && (
                      <button className="text-[10px] font-black text-slate-400 hover:text-slate-900 ml-auto uppercase tracking-widest">
                        Set Default
                      </button>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Security Tip */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden group">
         <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Globe className="h-40 w-40 text-primary" />
         </div>
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="h-16 w-16 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/10">
               <Globe className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
               <h4 className="text-xl font-extrabold">Your address privacy is our priority</h4>
               <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-2xl">
                 We only share your precise event location with confirmed vendors after a booking is secured. For all inquiries and pending requests, we only display the general locality to protect your security.
               </p>
            </div>
         </div>
      </div>
    </div>

  );
}
