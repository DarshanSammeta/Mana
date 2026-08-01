"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { XCircle, LogOut, MessageSquare, AlertOctagon } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function VendorRejectedPage() {
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
          <CardHeader className="bg-red-50 border-b border-red-100 p-8 text-center">
            <div className="mx-auto h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <CardTitle className="text-3xl font-black text-red-900">Application Rejected</CardTitle>
            <CardDescription className="font-bold text-red-700">We regret to inform you that your vendor application was not approved.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="p-6 bg-red-50/50 rounded-2xl border border-red-100">
                <h4 className="text-xs font-black text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <AlertOctagon className="h-4 w-4" /> Reason for Rejection
                </h4>
                <p className="text-sm font-bold text-red-800 leading-relaxed">
                    Based on our review, your application did not meet our community guidelines or verification standards. Common reasons include missing documents, incorrect business details, or service quality concerns.
                </p>
            </div>

            <div className="space-y-4">
                <h4 className="font-black text-slate-900 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" /> Want to appeal?
                </h4>
                <p className="text-sm text-slate-600 font-medium">
                    If you believe this was a mistake or you have updated your information, please contact our support team at <a href="mailto:appeals@manaevents.com" className="text-primary font-bold hover:underline">appeals@manaevents.com</a>.
                </p>
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
