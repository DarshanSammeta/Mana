"use client";

import { cn } from "@/lib/utils";
import {
  Sparkles,
  Users,
  MapPin,
  ClipboardList,
  CheckCircle2,
  CreditCard,
} from "lucide-react";
import { memo } from "react";

const STEPS = [
  { id: 1, name: "Event Type", icon: Sparkles },
  { id: 2, name: "Guests", icon: Users },
  { id: 3, name: "Venue", icon: MapPin },
  { id: 4, name: "Menu", icon: ClipboardList },
  { id: 5, name: "Review", icon: CheckCircle2 },
  { id: 6, name: "Payment", icon: CreditCard },
  { id: 7, name: "Confirmation", icon: CheckCircle2 },
];

export const BookingProgress = memo(function BookingProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="sticky top-[105px] z-40 bg-white/95 backdrop-blur-sm border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-14 flex items-center justify-between gap-8">
          {/* Mobile Step Info */}
          <div className="lg:hidden flex items-center gap-3">
             <div className="h-8 w-8 rounded-lg bg-[#6D28D9]/10 flex items-center justify-center">
                {(() => {
                    const Icon = STEPS[currentStep - 1].icon;
                    return <Icon className="h-4 w-4 text-[#6D28D9]" />;
                })()}
             </div>
             <div>
                <p className="text-[10px] font-black text-[#6D28D9] uppercase tracking-widest leading-none">Step {currentStep}</p>
                <p className="text-xs font-bold text-slate-900 uppercase italic">{STEPS[currentStep - 1].name}</p>
             </div>
          </div>

          {/* Desktop Stepper */}
          <div className="hidden lg:flex items-center gap-2 flex-1 justify-between max-w-4xl">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 flex-1 group">
                <div className={cn(
                  "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                  s.id === currentStep ? "border-[#6D28D9] bg-[#6D28D9] text-white shadow-lg shadow-[#6D28D9]/20" :
                  s.id < currentStep ? "border-emerald-500 bg-emerald-50 text-emerald-600" : "border-slate-100 text-slate-300"
                )}>
                  {s.id < currentStep ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-[10px] font-bold">{s.id}</span>}
                </div>
                <div className="min-w-0">
                   <p className={cn(
                       "text-[9px] font-black uppercase tracking-widest leading-none mb-0.5",
                       s.id === currentStep ? "text-[#6D28D9]" : "text-slate-400"
                   )}>Step 0{s.id}</p>
                   <p className={cn(
                       "text-[10px] font-bold uppercase truncate",
                       s.id === currentStep ? "text-slate-900 italic" : "text-slate-400"
                   )}>{s.name}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("h-0.5 flex-1 mx-2 rounded-full", s.id < currentStep ? "bg-emerald-100" : "bg-slate-50")} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
