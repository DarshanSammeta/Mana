"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { XCircle, RefreshCcw, Headphones } from "lucide-react";

function FailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reason = searchParams?.get("reason");

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-2xl mx-auto px-4 py-20">
        <div className="text-center">
          <div className="mb-10 flex justify-center">
            <div className="h-24 w-24 bg-red-50 rounded-full flex items-center justify-center border border-red-100 shadow-sm">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>

          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Payment Failed</h1>
          <p className="text-slate-600 text-lg mb-10 leading-relaxed max-w-md mx-auto">
            {reason === "verification_failed"
              ? "We couldn't verify your payment signature. If money was deducted, it will be refunded automatically within 5-7 business days."
              : "Something went wrong during the transaction. Your security is our priority, and no funds were captured if the process was interrupted."}
          </p>

          <div className="space-y-4 max-w-sm mx-auto">
            <Button
              className="w-full h-14 rounded-xl font-black bg-primary hover:bg-blue-700 text-white shadow-lg transition-all text-lg"
              onClick={() => router.push("/customer/checkout")}
            >
              <RefreshCcw className="mr-2 h-5 w-5" /> Retry Payment
            </Button>
            <Button
              variant="outline"
              className="w-full h-14 rounded-xl font-bold border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <Headphones className="mr-2 h-5 w-5" /> Contact Support
            </Button>
          </div>

          <div className="mt-16 pt-8 border-t border-slate-100">
            <p className="text-sm text-slate-400">
              Need help? Call us at <span className="font-bold text-slate-600">1-800-MANA-HELP</span> or email <span className="font-bold text-slate-600">support@manaevents.in</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OrderFailedPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
            <FailedContent />
        </Suspense>
    );
}
