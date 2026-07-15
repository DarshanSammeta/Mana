"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, ExternalLink, Clock, User, Building2, CreditCard, ShieldCheck, MapPin, Phone, Mail, AlertTriangle, MessageSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { adminService } from "@/services/client";
import { toast } from "sonner";

export default function VendorDetailAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const data = await adminService.getVendorDetails(id);
        setVendor(data);
      } catch {
        toast.error("Failed to load vendor details");
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [id]);

  const handleAction = async (status: "APPROVED" | "REJECTED" | "CHANGES_REQUIRED") => {
    if (status !== "APPROVED" && !comment) {
      toast.error("Please provide a reason/comment for this action");
      return;
    }

    setActionLoading(true);
    try {
      await adminService.verifyVendor(id, {
        status,
        comment,
        rejectionReason: comment,
        rejectedDocuments: selectedDocs
      });
      toast.success(`Vendor ${status.toLowerCase()} successfully`);
      router.push("/admin/documents");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-12 text-center font-bold">Loading Vendor Profile...</div>;
  if (!vendor) return <div className="p-12 text-center text-red-500 font-bold">Vendor not found</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
                <h1 className="text-3xl font-black tracking-tight text-gray-900">{vendor.businessName}</h1>
                <div className="flex items-center gap-2 mt-1">
                    <Badge className={cn(
                        "font-bold px-3",
                        vendor.verificationStatus === 'APPROVED' ? "bg-green-100 text-green-700" :
                        vendor.verificationStatus === 'REJECTED' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    )}>
                        {vendor.verificationStatus}
                    </Badge>
                    <span className="text-sm text-gray-400 font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Registered on {new Date(vendor.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Business & Owner Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[24px] overflow-hidden border-gray-100 shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <User className="h-5 w-5 text-gray-400" /> Business & Owner Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Business Details</h3>
                    <div className="space-y-3">
                        <InfoItem icon={<Building2 className="h-4 w-4" />} label="Business Name" value={vendor.businessName} />
                        <InfoItem icon={<MapPin className="h-4 w-4" />} label="Address" value={`${vendor.address}, ${vendor.city}, ${vendor.state} - ${vendor.zipCode}`} />
                        <InfoItem icon={<ShieldCheck className="h-4 w-4" />} label="GST Number" value={vendor.gstNumber || "Not Provided"} />
                        <InfoItem icon={<MapPin className="h-4 w-4" />} label="Radius" value={`${vendor.serviceRadius} KM`} />
                    </div>
                </div>
                <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Owner Details</h3>
                    <div className="space-y-3">
                        <InfoItem icon={<User className="h-4 w-4" />} label="Full Name" value={vendor.user.fullName} />
                        <InfoItem icon={<Mail className="h-4 w-4" />} label="Email Address" value={vendor.user.email} />
                        <InfoItem icon={<Phone className="h-4 w-4" />} label="Mobile Number" value={vendor.user.mobileNumber} />
                    </div>
                </div>
            </CardContent>
          </Card>

          <Card className="rounded-[24px] overflow-hidden border-gray-100 shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
              <CardTitle className="text-lg font-black flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gray-400" /> Bank & Financials
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoItem label="Account Holder" value={vendor.bankDetails?.accountHolderName || "N/A"} />
                    <InfoItem label="Bank Name" value={vendor.bankDetails?.bankName || "N/A"} />
                    <InfoItem label="Account Number" value={vendor.bankDetails?.accountNumber || "N/A"} />
                    <InfoItem label="IFSC Code" value={vendor.bankDetails?.ifscCode || "N/A"} />
                </div>
            </CardContent>
          </Card>

          <Card className="rounded-[24px] overflow-hidden border-gray-100 shadow-sm">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
              <CardTitle className="text-lg font-black">KYC Documents Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {vendor.vendordocument.map((doc: any) => (
                        <div key={doc.id} className={cn(
                            "group relative aspect-video rounded-xl border overflow-hidden bg-slate-50",
                            selectedDocs.includes(doc.type) ? "border-red-500 ring-2 ring-red-100" : "border-slate-200"
                        )}>
                            <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
                                <Badge className="bg-white/90 text-slate-900 backdrop-blur-sm border-none font-bold text-[10px] uppercase">
                                    {doc.type.replace('_', ' ')}
                                </Badge>
                                {doc.status === 'APPROVED' && <Badge className="bg-green-500 text-white border-none"><Check className="h-3 w-3" /></Badge>}
                            </div>

                            <div className="absolute top-2 right-2 z-10">
                                <Checkbox
                                    id={`doc-${doc.id}`}
                                    checked={selectedDocs.includes(doc.type)}
                                    onCheckedChange={(checked) => {
                                        if (checked) setSelectedDocs([...selectedDocs, doc.type]);
                                        else setSelectedDocs(selectedDocs.filter(t => t !== doc.type));
                                    }}
                                    className="h-5 w-5 bg-white border-slate-300 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                                />
                            </div>

                            {doc.url.toLowerCase().endsWith('.pdf') ? (
                                <div className="h-full w-full flex flex-col items-center justify-center gap-2">
                                    <FileText className="h-8 w-8 text-slate-300" />
                                    <span className="text-[10px] font-bold text-slate-400">PDF DOCUMENT</span>
                                </div>
                            ) : (
                                <Image src={doc.url} alt={doc.type} fill className="object-cover" unoptimized />
                            )}

                            <a href={doc.url} target="_blank" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs">
                                <ExternalLink className="h-4 w-4" /> View Full
                            </a>
                        </div>
                    ))}
                </div>
                {vendor.vendordocument.length === 0 && (
                    <div className="text-center py-12 text-slate-400 italic">No documents uploaded yet.</div>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Admin Actions */}
        <div className="space-y-6">
            <Card className="rounded-[24px] border-2 border-primary/10 shadow-lg sticky top-24">
                <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle className="text-lg font-black">Verification Verdict</CardTitle>
                    <CardDescription className="text-xs font-medium">Decide the fate of this vendor application</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-3">
                        <Label htmlFor="comment" className="text-xs font-black uppercase tracking-widest text-gray-400">Admin Comment / Reason</Label>
                        <Textarea
                            id="comment"
                            placeholder="Type rejection reason or missing requirements here..."
                            className="min-h-[120px] rounded-xl border-gray-200 focus:ring-primary/20"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>

                    <div className="space-y-3 pt-2">
                        <Button
                            className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black shadow-lg shadow-green-200"
                            disabled={actionLoading}
                            onClick={() => handleAction("APPROVED")}
                        >
                            <Check className="h-5 w-5 mr-2" /> Approve Application
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full h-12 rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50 font-black"
                            disabled={actionLoading}
                            onClick={() => handleAction("CHANGES_REQUIRED")}
                        >
                            <MessageSquare className="h-5 w-5 mr-2" /> Request Changes
                        </Button>
                        <Button
                            variant="destructive"
                            className="w-full h-12 rounded-xl font-black shadow-lg shadow-red-200"
                            disabled={actionLoading}
                            onClick={() => handleAction("REJECTED")}
                        >
                            <X className="h-5 w-5 mr-2" /> Reject Application
                        </Button>
                    </div>

                    {selectedDocs.length > 0 && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                            <p className="text-[11px] text-red-700 font-medium">
                                <strong>Warning:</strong> You have selected {selectedDocs.length} documents for rejection. They will be marked as invalid.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="rounded-[24px] border-gray-100 shadow-sm bg-slate-50">
                <CardContent className="p-6">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Quick Stats</h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-500">Subscription</span>
                            <Badge variant="outline" className="font-bold border-primary/20 text-primary">
                                {vendor.vendorsubscription?.subscriptionplan?.name || "None"}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-500">Total Bookings</span>
                            <span className="font-bold">{vendor.totalBookings}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-500">Trust Score</span>
                            <span className="font-bold text-green-600">{vendor.reliabilityScore}%</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon?: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                {icon} {label}
            </span>
            <span className="text-sm font-bold text-gray-900 leading-snug">{value}</span>
        </div>
    );
}

function FileText({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
    )
}
