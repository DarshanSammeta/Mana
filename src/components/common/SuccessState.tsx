"use client";

import { CheckCircle2, Home, ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface SuccessStateProps {
  title?: string;
  message?: string;
  onContinue?: () => void;
  continueText?: string;
  showHome?: boolean;
  onDownload?: () => void;
  downloadText?: string;
  children?: React.ReactNode;
}

export default function SuccessState({
  title = "Success!",
  message = "Your action has been completed successfully.",
  onContinue,
  continueText = "Continue",
  showHome = true,
  onDownload,
  downloadText = "Download",
  children
}: SuccessStateProps) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center w-full"
    >
      <div className="relative mb-8">
        <div className="h-24 w-24 rounded-[32px] bg-green-500/10 flex items-center justify-center relative z-10">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <div className="absolute inset-0 bg-green-500/5 rounded-full blur-2xl animate-pulse" />
      </div>

      <h3 className="text-2xl font-black text-[#111827] mb-3 tracking-tight">{title}</h3>
      <p className="text-slate-500 max-w-md mb-8 font-medium text-balance leading-relaxed">
        {message}
      </p>

      {children && (
        <div className="w-full max-w-2xl mb-10 text-left">
          {children}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
        {onContinue && (
          <Button
            onClick={onContinue}
            className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold gap-3 shadow-xl shadow-slate-200 transition-all hover:scale-105 active:scale-95"
          >
            {continueText}
            <ArrowRight className="h-5 w-5" />
          </Button>
        )}

        {onDownload && (
          <Button
            variant="outline"
            onClick={onDownload}
            className="h-14 px-8 rounded-2xl border-2 border-slate-200 font-bold gap-3 hover:bg-slate-50 transition-all"
          >
            <Download className="h-5 w-5" />
            {downloadText}
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
