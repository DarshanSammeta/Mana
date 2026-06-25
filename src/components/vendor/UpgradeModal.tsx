"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Zap, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  feature?: string;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  title = "Premium Feature",
  description = "This feature is only available for Starter, Pro and Premium members.",
  feature
}: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header Image/Icon */}
          <div className="h-32 bg-primary/10 flex items-center justify-center relative">
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
               <Crown className="text-white h-8 w-8" />
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <div className="p-8 text-center">
            <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">{title}</h2>
            <p className="text-muted-foreground font-medium mb-8 leading-relaxed">
              {description}
            </p>

            <div className="space-y-3">
              <Link
                href="/vendor/subscription"
                className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-2xl text-sm font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/20 transition-all"
              >
                <Zap className="h-4 w-4" /> View Plans & Upgrade
              </Link>
              <button
                onClick={onClose}
                className="w-full py-4 text-muted-foreground text-xs font-black uppercase tracking-widest hover:text-foreground transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>

          <div className="p-4 bg-muted/50 border-t border-border flex items-center justify-center gap-2">
            <ShieldAlert className="h-4 w-4 text-accent" />
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Growth Plan Recommended</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
