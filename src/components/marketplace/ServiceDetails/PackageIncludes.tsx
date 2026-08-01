"use client";

import { memo } from "react";
import { Check, X, ShieldAlert, Info, Zap, CalendarDays } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface Package {
  id: string;
  name: string;
  price: number | string;
  description?: string;
  inclusions?: any;
  exclusions?: any;
}

interface PackageIncludesProps {
  selectedPackage: Package | null;
}

const PackageIncludes = memo(function PackageIncludes({ selectedPackage }: PackageIncludesProps) {
  if (!selectedPackage) return null;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
           <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">
             Package Includes: {selectedPackage.name}
           </h2>
           <div className="text-right">
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Base Rate</p>
             <p className="text-2xl font-black text-primary">{formatCurrency(Number(selectedPackage.price))}</p>
           </div>
        </div>
        <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-4xl border-l-4 border-primary/20 pl-6">
          {selectedPackage.description || "Comprehensive service package tailored for your event requirements. High-quality execution guaranteed by our verified professionals."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Inclusions */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
             <Zap className="h-5 w-5 text-emerald-500" />
             <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Included Features</h3>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
            {Array.isArray(selectedPackage.inclusions) ? (
              selectedPackage.inclusions.map((inc, i) => (
                <li key={i} className="flex items-start gap-3 text-sm font-bold text-slate-700">
                  <div className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-emerald-600" />
                  </div>
                  <span>{typeof inc === 'string' ? inc : inc.name}</span>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-400 italic">Standard industry inclusions apply.</li>
            )}
          </ul>
        </div>

        {/* Exclusions & Policy */}
        <div className="space-y-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
               <ShieldAlert className="h-5 w-5 text-rose-500" />
               <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Exclusions & Constraints</h3>
            </div>
            <ul className="space-y-3">
              {Array.isArray(selectedPackage.exclusions) ? (
                selectedPackage.exclusions.map((exc, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm font-bold text-slate-500">
                    <X className="h-4 w-4 text-rose-300 mt-0.5 shrink-0" />
                    <span>{typeof exc === 'string' ? exc : exc.name}</span>
                  </li>
                ))
              ) : (
                <li className="flex items-start gap-3 text-sm font-bold text-slate-500">
                    <X className="h-4 w-4 text-rose-300 mt-0.5 shrink-0" />
                    <span>Travel beyond 50km is extra.</span>
                </li>
              )}
            </ul>
          </div>

          <Separator className="bg-slate-100" />

          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <CalendarDays className="h-5 w-5 text-blue-500" />
               <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Cancellation Policy</h3>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-sm font-bold text-slate-700 mb-2">Standard Amazon-Style Policy:</p>
                <p className="text-xs font-medium text-slate-500 leading-relaxed">
                  Full refund for cancellations made within 24 hours of booking. 50% refund for cancellations made at least 15 days before the event date. No refunds for cancellations within 7 days of the event.
                </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-primary/5 p-8 rounded-[2.5rem] flex items-center gap-6 border border-primary/10">
        <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-sm">
            <Info className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Amazon-style Guarantee</h4>
            <p className="text-xs font-bold text-slate-500">All inclusions are verified by Mana Quality Team. What you see is what you get.</p>
        </div>
      </div>
    </div>
  );
});

export default PackageIncludes;
