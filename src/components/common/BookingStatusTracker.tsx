"use client";

import { motion } from "framer-motion";
import {
  UserCheck,
  ShieldCheck,
  Key, // Replaced OtpCode with Key
  PartyPopper,
  CheckCircle2,
  Clock,
  Navigation,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";

const FLOW_STEPS = [
  { id: 'PENDING', label: 'Requested', icon: Clock, desc: 'System searching nearby vendors' },
  { id: 'ACCEPTED', label: 'Accepted', icon: UserCheck, desc: 'Vendor confirmed availability' },
  { id: 'CONFIRMED', label: 'Verified', icon: ShieldCheck, desc: 'OTP & ID Verification complete' },
  { id: 'OTP_VERIFIED', label: 'OTP verified', icon: Key, desc: 'Vendor confirmed with OTP' },
  { id: 'VENDOR_TRAVELING', label: 'En Route', icon: Navigation, desc: 'Vendor is traveling to venue' },
  { id: 'EVENT_STARTED', label: 'Live', icon: PartyPopper, desc: 'Event is currently ongoing' },
  { id: 'EVENT_COMPLETED', label: 'Done', icon: CheckCircle2, desc: 'Service delivered successfully' },
  { id: 'PAID', label: 'Payout', icon: CreditCard, desc: 'Payment released to vendor' },
];

export function BookingStatusTracker({ currentStatus }: { currentStatus: string }) {
  const currentIndex = FLOW_STEPS.findIndex(s => s.id === currentStatus);

  return (
    <div className="w-full py-12 px-4 overflow-x-auto">
      <div className="flex justify-between min-w-[800px] relative">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-secondary -translate-y-1/2 z-0" />
        <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(currentIndex / (FLOW_STEPS.length - 1)) * 100}%` }}
            className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0"
        />

        {FLOW_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.2 : 1,
                  backgroundColor: isCompleted || isActive ? "var(--primary)" : "var(--secondary)",
                }}
                className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center shadow-xl transition-colors",
                  (isCompleted || isActive) ? "text-white" : "text-muted-foreground"
                )}
              >
                <Icon className="h-6 w-6" />

                {isCompleted && (
                    <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-background">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                )}
              </motion.div>

              <div className="mt-4 text-center">
                <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    isActive ? "text-primary" : "text-muted-foreground"
                )}>
                    {step.label}
                </p>
                <p className="text-[9px] font-bold text-muted-foreground/60 w-24 mt-1 leading-tight opacity-0 group-hover:opacity-100 transition-opacity">
                    {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
