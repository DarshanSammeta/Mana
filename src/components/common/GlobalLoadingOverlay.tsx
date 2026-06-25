"use client";

import { useLoadingStore } from "@/store/loadingStore";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function GlobalLoadingOverlay() {
  const { isLoading, message } = useLoadingStore();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/60 backdrop-blur-md transition-all"
        >
          <div className="relative flex flex-col items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="text-primary"
            >
              <Loader2 className="h-12 w-12" />
            </motion.div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <span className="text-xl font-black tracking-tight text-slate-900">
                mana<span className="text-primary">Events</span>
              </span>
              <p className="mt-2 text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">
                {message}
              </p>
            </motion.div>
          </div>

          {/* Prevent clicks */}
          <div className="absolute inset-0 cursor-wait" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
