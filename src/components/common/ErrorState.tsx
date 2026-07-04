"use client";

import { AlertCircle, RefreshCcw, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showBack?: boolean;
  showHome?: boolean;
}

export default function ErrorState({
  title = "Something went wrong",
  message = "We encountered an error while loading the data. Please try again.",
  onRetry,
  showBack = true,
  showHome = true
}: ErrorStateProps) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center"
    >
      <div className="relative mb-8">
        <div className="h-24 w-24 rounded-[32px] bg-destructive/10 flex items-center justify-center relative z-10">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <div className="absolute inset-0 bg-destructive/5 rounded-full blur-2xl animate-pulse" />
      </div>

      <h3 className="text-2xl font-black text-[#111827] mb-3 tracking-tight">{title}</h3>
      <p className="text-slate-500 max-w-md mb-10 font-medium text-balance leading-relaxed">
        {message}
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        {onRetry && (
          <Button
            onClick={onRetry}
            className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold gap-3 shadow-xl shadow-slate-200 transition-all hover:scale-105 active:scale-95"
          >
            <RefreshCcw className="h-5 w-5" />
            Try Again
          </Button>
        )}

        {showBack && (
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="h-14 px-8 rounded-2xl border-2 border-slate-200 font-bold gap-3 hover:bg-slate-50 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </Button>
        )}

        {showHome && (
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="h-14 px-8 rounded-2xl font-bold gap-3 text-slate-500 hover:text-slate-900 transition-all"
          >
            <Home className="h-5 w-5" />
            Home
          </Button>
        )}
      </div>
    </motion.div>
  );
}
