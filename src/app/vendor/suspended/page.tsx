"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, LogOut, Info, ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function VendorSuspendedPage() {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-white">
          <CardHeader className="bg-amber-50 border-b border-amber-100 p-8 text-center">
            <div className="mx-auto h-20 w-20 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <ShieldAlert className="h-10 w-10 text-amber-600" />
            </div>
            <CardTitle className="text-3xl font-black text-amber-900">Account Suspended</CardTitle>
            <CardDescription className="font-bold text-amber-700">Access to your vendor account has been temporarily restricted.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex gap-4 p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                <Info className="h-6 w-6 text-amber-600 shrink-0" />
                <div className="space-y-1">
                    <h4 className="text-sm font-black text-amber-900">Why was my account suspended?</h4>
                    <p className="text-xs font-medium text-amber-800 leading-relaxed">
                        Suspensions typically occur due to policy violations, multiple customer complaints, or pending verification issues.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="font-black text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-primary" /> Next Steps
                </h4>
                <ul className="space-y-3 text-sm text-slate-600 font-medium">
                    <li className="flex gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        Check your email for a detailed notice regarding the suspension.
                    </li>
                    <li className="flex gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        Resolve any outstanding issues mentioned in the notice.
                    </li>
                    <li className="flex gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        Contact <a href="mailto:compliance@manaevents.com" className="text-primary font-bold hover:underline">compliance@manaevents.com</a> to request reactivation.
                    </li>
                </ul>
            </div>

            <Button
                onClick={handleLogout}
                className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black shadow-lg"
            >
                <LogOut className="mr-2 h-5 w-5" /> Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
