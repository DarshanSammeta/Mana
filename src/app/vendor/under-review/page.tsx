"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, MessageSquare, ShieldCheck, LogOut, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

export default function VendorUnderReviewPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // In a real app, this would refresh the session/JWT
    window.location.reload();
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Application Under Review</h1>
          <p className="text-slate-500 font-medium">We&apos;re verifying your business details to ensure a safe marketplace.</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-white">
          <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-black">Verification Status</CardTitle>
                <CardDescription className="font-bold text-primary">Status: {isMounted ? (user?.verificationStatus || 'PENDING') : '...'}</CardDescription>
              </div>
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 px-4 py-1.5 rounded-full font-black text-xs border-amber-200">
                PENDING REVIEW
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatusStep icon={<CheckCircle2 className="h-6 w-6 text-green-500" />} title="Application Received" completed />
              <StatusStep icon={<Clock className="h-6 w-6 text-amber-500 animate-pulse" />} title="Admin Review" active />
              <StatusStep icon={<ShieldCheck className="h-6 w-6 text-slate-300" />} title="Full Access" />
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
              <h4 className="font-black text-slate-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" /> What&apos;s next?
              </h4>
              <ul className="space-y-3 text-sm text-slate-600 font-medium">
                <li className="flex gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  Our team will review your documents and business information within 24-48 hours.
                </li>
                <li className="flex gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  You&apos;ll receive an email notification once the review is complete.
                </li>
                <li className="flex gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  If we need more information, we&apos;ll reach out to you directly.
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={handleRefresh}
                className="flex-1 h-12 rounded-xl font-black bg-primary hover:bg-primary/90 text-white"
                disabled={isRefreshing}
              >
                <RefreshCcw className={`mr-2 h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh Status
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex-1 h-12 rounded-xl border-slate-200 font-black text-slate-600 hover:bg-slate-50"
              >
                <LogOut className="mr-2 h-5 w-5" /> Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-slate-400 text-xs font-bold space-y-2">
          <p>Need urgent help? Contact our vendor support at <a href="mailto:vendors@manaevents.com" className="text-primary hover:underline">vendors@manaevents.com</a></p>
          <div className="flex justify-center gap-4">
            <Link href="#" className="hover:text-slate-600">Vendor Policy</Link>
            <Link href="#" className="hover:text-slate-600">FAQ</Link>
            <Link href="#" className="hover:text-slate-600">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusStep({ icon, title, completed, active }: { icon: React.ReactNode, title: string, completed?: boolean, active?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-3 p-4 rounded-2xl border ${active ? 'bg-white border-primary/20 shadow-lg' : 'bg-transparent border-transparent'}`}>
      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${completed ? 'bg-green-50' : active ? 'bg-primary/10' : 'bg-slate-100'}`}>
        {icon}
      </div>
      <span className={`text-xs font-black text-center ${active ? 'text-primary' : completed ? 'text-slate-900' : 'text-slate-400'}`}>
        {title}
      </span>
    </div>
  );
}
