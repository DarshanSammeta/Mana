"use client";

import {
  FileText,
  Upload,
  ShieldCheck,
  Eye,
  Download,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { vendorService } from "@/services/vendor.service";
import { toast } from "react-hot-toast";

interface Document {
  id: string;
  name: string;
  type: string;
  status: "Verified" | "Pending" | "Expired" | "Rejected";
  updatedAt: string;
  url: string;
}

export default function DocumentCenter() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [verificationData, setVerificationData] = useState<{ score: number, isVerified: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docs, status] = await Promise.all([
        vendorService.getDocuments(),
        vendorService.getVerificationStatus()
      ]);
      setDocuments(docs);
      setVerificationData(status);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      // In a real app, you might want a modal to ask for document name/type
      await vendorService.uploadDocument({
        name: file.name,
        type: "OTHER",
        file
      });
      toast.success("Document uploaded successfully");
      fetchData();
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Document Center</h1>
          <p className="text-slate-500 mt-2">Manage your business verification and legal documents.</p>
        </div>
        <label className="px-8 py-4 rounded-2xl bg-blue-600 text-white font-black text-sm shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            {uploading ? "Uploading..." : "Upload New Document"}
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className={cn(
            "p-8 rounded-[32px] border",
            verificationData?.isVerified
              ? "bg-emerald-500/10 border-emerald-500/20"
              : "bg-orange-500/10 border-orange-500/20"
          )}>
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center mb-6",
                verificationData?.isVerified ? "bg-emerald-500/20" : "bg-orange-500/20"
              )}>
                <ShieldCheck className={cn(
                  "h-6 w-6",
                  verificationData?.isVerified ? "text-emerald-600" : "text-orange-600"
                )} />
              </div>
              <h3 className={cn(
                "text-xl font-black",
                verificationData?.isVerified ? "text-emerald-700" : "text-orange-700"
              )}>
                {verificationData?.isVerified ? "Business Verified" : "Verification Pending"}
              </h3>
              <p className={cn(
                "text-sm mt-2 font-medium",
                verificationData?.isVerified ? "text-emerald-600/80" : "text-orange-600/80"
              )}>
                {verificationData?.isVerified
                  ? "Your account is fully verified for high-value transactions."
                  : "Complete your document submissions to enable all features."}
              </p>
          </div>

          <div className="p-8 rounded-[32px] bg-white border border-slate-200 shadow-sm col-span-2 flex items-center gap-8">
              <div className="flex-1">
                <h3 className="text-lg font-black text-slate-900">Verification Score</h3>
                <p className="text-sm text-slate-500 mt-1 font-medium">Complete all documents to reach 100% and gain &quot;Premium Partner&quot; badge.</p>
              </div>
              <div className="h-24 w-24 rounded-full border-8 border-slate-100 flex items-center justify-center relative">
                  <span className="text-xl font-black text-slate-900">{verificationData?.score || 0}%</span>
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-blue-600"
                        strokeDasharray="251.2"
                        strokeDashoffset={251.2 - (251.2 * (verificationData?.score || 0)) / 100}
                        strokeLinecap="round"
                      />
                  </svg>
              </div>
          </div>
      </div>

      <div className="p-8 rounded-[32px] bg-white border border-slate-200 shadow-sm">
          <h2 className="text-xl font-black mb-8 text-slate-900">Verification Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documents.map((doc) => (
                  <div key={doc.id} className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50 hover:border-blue-500/30 transition-all flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                          <div className={cn(
                              "h-14 w-14 rounded-2xl flex items-center justify-center",
                              doc.status === "Verified" ? "bg-emerald-500/10" :
                              doc.status === "Pending" ? "bg-orange-500/10" : "bg-red-500/10"
                          )}>
                              <FileText className={cn(
                                  "h-6 w-6",
                                  doc.status === "Verified" ? "text-emerald-600" :
                                  doc.status === "Pending" ? "text-orange-600" : "text-red-600"
                              )} />
                          </div>
                          <div>
                              <h4 className="font-black text-slate-900">{doc.name}</h4>
                              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{doc.type}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                              <span className={cn(
                                  "px-3 py-1 rounded-full text-[10px] font-black uppercase",
                                  doc.status === "Verified" ? "bg-emerald-500/10 text-emerald-600" :
                                  doc.status === "Pending" ? "bg-orange-500/10 text-orange-600" : "bg-red-500/10 text-red-600"
                              )}>
                                  {doc.status}
                              </span>
                              <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">Updated: {new Date(doc.updatedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => window.open(doc.url, '_blank')}
                                className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <a
                                href={doc.url}
                                download
                                className="p-2 rounded-xl hover:bg-slate-100 text-blue-600 transition-colors"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                          </div>
                      </div>
                  </div>
              ))}
              {documents.length === 0 && (
                <div className="col-span-2 py-12 text-center text-slate-500 font-medium">
                  No documents found. Please upload your verification documents.
                </div>
              )}
          </div>
      </div>

      <div className="p-8 rounded-[32px] bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-slate-900/20">
          <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-black mb-2 text-white">Need help with verification?</h3>
              <p className="text-slate-400 text-sm font-medium">Our compliance team is here to help you get your business ready for the platform. Reach out to our partner support.</p>
          </div>
          <button className="px-8 py-4 rounded-2xl bg-blue-600 text-white font-black text-sm hover:scale-105 transition-all shadow-lg">
              Contact Support
          </button>
      </div>
    </div>
  );
}
