"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { XCircle, RefreshCcw, Headphones } from "lucide-react";
import Navbar from "@/components/common/Navbar";

function FailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams?.get("bookingId");
  const reason = searchParams?.get("reason");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-2">Payment Failed</h1>
          <p className="text-muted-foreground mb-8">
            {reason === "verification_failed"
              ? "We couldn't verify your payment signature. If money was deducted, it will be refunded automatically."
              : "Something went wrong during the transaction. Please try again."}
          </p>

          <div className="space-y-4">
            <Button className="w-full h-12" onClick={() => router.push("/checkout")}>
              <RefreshCcw className="mr-2 h-4 w-4" /> Retry Payment
            </Button>
            <Button variant="outline" className="w-full h-12">
              <Headphones className="mr-2 h-4 w-4" /> Contact Support
            </Button>
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
