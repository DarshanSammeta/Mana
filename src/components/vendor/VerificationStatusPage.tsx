"use client";

import { CheckCircle2, Clock, AlertCircle, XCircle, FileText, HeadphonesIcon, ArrowRight, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface VerificationStatusPageProps {
  status: "PENDING" | "REJECTED" | "SUSPENDED" | "CHANGES_REQUIRED";
  rejectionReason?: string;
  rejectedDocuments?: string[];
}

export default function VerificationStatusPage({
  status,
  rejectionReason,
  rejectedDocuments = [],
}: VerificationStatusPageProps) {
  const steps = [
    { name: "Account Created", status: "complete" },
    { name: "Business Profile", status: "complete" },
    { name: "KYC Upload", status: "complete" },
    {
      name: "Admin Review",
      status: status === "PENDING" ? "current" : status === "REJECTED" ? "failed" : "complete",
    },
    { name: "Approved", status: (status as string) === "APPROVED" ? "complete" : "pending" },
  ];

  const getProgress = () => {
    if (status === "PENDING") return 75;
    if (status === "REJECTED") return 60;
    if (status === "CHANGES_REQUIRED") return 60;
    return 100;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-2xl border-2 shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            {status === "PENDING" && (
              <div className="p-4 bg-yellow-50 rounded-full">
                <Clock className="h-12 w-12 text-yellow-600 animate-pulse" />
              </div>
            )}
            {status === "REJECTED" && (
              <div className="p-4 bg-red-50 rounded-full">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
            )}
            {status === "CHANGES_REQUIRED" && (
              <div className="p-4 bg-orange-50 rounded-full">
                <AlertCircle className="h-12 w-12 text-orange-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === "PENDING" && "Verification Under Review"}
            {status === "REJECTED" && "Verification Failed"}
            {status === "CHANGES_REQUIRED" && "Changes Required"}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {status === "PENDING" && "Your documents are currently being reviewed by our compliance team."}
            {status === "REJECTED" && "Unfortunately, your verification was not successful."}
            {status === "CHANGES_REQUIRED" && "Our team requires some changes to your profile or documents."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          {/* Progress Tracker */}
          <div className="space-y-4">
            <div className="flex justify-between text-sm font-medium">
              <span>Onboarding Progress</span>
              <span>{getProgress()}%</span>
            </div>
            <Progress value={getProgress()} className="h-2" />

            <div className="grid grid-cols-5 gap-2 mt-4">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                      step.status === "complete" && "bg-green-100 text-green-700",
                      step.status === "current" && "bg-yellow-100 text-yellow-700 ring-2 ring-yellow-400 ring-offset-2",
                      step.status === "failed" && "bg-red-100 text-red-700",
                      step.status === "pending" && "bg-slate-100 text-slate-400"
                    )}
                  >
                    {step.status === "complete" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] text-center font-medium leading-tight",
                    step.status === "pending" ? "text-slate-400" : "text-slate-700"
                  )}>
                    {step.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Details Section */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
            {status === "PENDING" && (
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  Verification Submitted
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <Clock className="h-5 w-5 text-yellow-500 shrink-0" />
                  Estimated review time: 24–48 Hours
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                  All 5 mandatory documents uploaded
                </li>
              </ul>
            )}

            {(status === "REJECTED" || status === "CHANGES_REQUIRED") && (
              <div className="space-y-4">
                {rejectionReason && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Reason for {status === "REJECTED" ? "Rejection" : "Changes"}:</h4>
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 italic">
                      &quot;{rejectionReason}&quot;
                    </p>
                  </div>
                )}

                {rejectedDocuments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2">Affected Documents:</h4>
                    <div className="flex flex-wrap gap-2">
                      {rejectedDocuments.map((doc) => (
                        <span key={doc} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-600 uppercase">
                          {doc.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2">
          {status === "PENDING" ? (
            <>
              <Button asChild variant="outline" className="w-full sm:flex-1">
                <Link href="/vendor/documents">
                  <FileText className="mr-2 h-4 w-4" />
                  View Documents
                </Link>
              </Button>
              <Button asChild className="w-full sm:flex-1">
                <Link href="/support">
                  <HeadphonesIcon className="mr-2 h-4 w-4" />
                  Contact Support
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="w-full sm:flex-1 bg-primary hover:bg-primary/90">
                <Link href="/vendor/documents">
                  <Upload className="mr-2 h-4 w-4" />
                  Re-upload Documents
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:flex-1">
                <Link href="/vendor/onboarding">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Go to Onboarding
                </Link>
              </Button>
            </>
          )}
        </CardFooter>
      </Card>

      <p className="text-slate-400 text-xs mt-8">
        Reference ID: {Math.random().toString(36).substring(7).toUpperCase()} • Mana Events Verification System v2.0
      </p>
    </div>
  );
}
