"use client";

import { CheckCircle2, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineStepProps {
  title: string;
  description: string;
  status: "completed" | "current" | "pending";
  isLast?: boolean;
}

function TimelineStep({ title, description, status, isLast }: TimelineStepProps) {
  return (
    <div className="flex gap-4 min-h-[80px]">
      <div className="flex flex-col items-center">
        <div className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center border-2 shrink-0 transition-all",
          status === "completed" ? "bg-emerald-500 border-emerald-500 text-white" :
          status === "current" ? "border-primary bg-primary text-white shadow-lg shadow-primary/20 scale-110" :
          "border-slate-200 bg-white text-slate-300"
        )}>
          {status === "completed" ? <CheckCircle2 className="h-5 w-5" /> :
           status === "current" ? <Clock className="h-5 w-5" /> :
           <div className="h-2 w-2 rounded-full bg-slate-200" />}
        </div>
        {!isLast && <div className={cn(
          "w-0.5 flex-1 my-1",
          status === "completed" ? "bg-emerald-200" : "bg-slate-100"
        )} />}
      </div>
      <div className="pb-8">
        <h4 className={cn(
          "font-black text-sm uppercase tracking-tight",
          status === "pending" ? "text-slate-400" : "text-slate-900"
        )}>{title}</h4>
        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">{description}</p>
      </div>
    </div>
  );
}

export function PaymentTimeline() {
  return (
    <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
      <div className="flex items-center gap-2 mb-8">
         <Calendar className="h-4 w-4 text-primary" />
         <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Payment Timeline</h3>
      </div>

      <TimelineStep
        title="Booking Created"
        description="Your booking request is initialized"
        status="completed"
      />
      <TimelineStep
        title="Advance Payment"
        description="Pay 30% advance to confirm booking"
        status="current"
      />
      <TimelineStep
        title="Vendor Acceptance"
        description="Vendor reviews and accepts your event"
        status="pending"
      />
      <TimelineStep
        title="Event Day"
        description="The big day! Service is delivered"
        status="pending"
      />
      <TimelineStep
        title="Balance Payment"
        description="Pay remaining 70% after event completion"
        status="pending"
        isLast
      />
    </div>
  );
}
