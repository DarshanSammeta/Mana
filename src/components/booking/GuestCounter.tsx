"use client";

import { Minus, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GuestCounterProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  icon?: any;
  description?: string;
}

export function GuestCounter({
  label,
  value,
  onChange,
  min = 0,
  max = 10000,
  icon: Icon = Users,
  description
}: GuestCounterProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-sm group">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-[#6D28D9] group-hover:scale-110 transition-transform">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
          <p className="text-sm font-bold text-slate-900">{value} {label.split(' ')[0]}</p>
          {description && <p className="text-[9px] text-slate-400 font-medium">{description}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3 bg-white p-1 rounded-xl border shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-slate-50"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center text-sm font-black text-slate-900">{value}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-slate-50"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
