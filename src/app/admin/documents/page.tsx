"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, ExternalLink } from "lucide-react";
import { adminService } from "@/services/admin.service";
import { toast } from "react-hot-toast";
import Image from "next/image";

export default function AdminDocumentReview() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    try {
      const data = await adminService.getDocuments();
      setDocuments(data);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const updateDoc = async (id: string, status: string) => {
    try {
      await adminService.updateDocumentStatus(id, status);
      toast.success(`Document ${status}`);
      fetchDocs();
    } catch {
      toast.error("Update failed");
    }
  };

  if (loading) return <div className="p-8 text-center font-bold">Loading Verification Queue...</div>;

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight text-gray-900">Verification Queue</h1>
        <Badge variant="outline" className="rounded-full px-4 py-1 font-bold text-primary border-primary/20 bg-primary/5">
          {documents.filter(d => d.status === 'PENDING').length} Pending Requests
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <Card key={doc.id} className="border-gray-100 rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-6">
              <div className="flex justify-between items-start">
                 <div>
                    <h3 className="font-black text-gray-900 leading-tight">{doc.vendorprofile.businessName}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{doc.type.replace('_', ' ')}</p>
                 </div>
                 <Badge className={cn(
                    "rounded-lg font-bold text-[10px]",
                    doc.status === 'APPROVED' ? "bg-green-100 text-green-700" :
                    doc.status === 'REJECTED' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                 )}>
                    {doc.status}
                 </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 relative group">
                 {doc.url.endsWith('.pdf') ? (
                    <div className="h-full w-full flex items-center justify-center text-gray-400 font-bold">PDF Document</div>
                 ) : (
                    <Image src={doc.url} alt="Verification Doc" fill className="object-cover" unoptimized />
                 )}
                 <a
                    href={doc.url}
                    target="_blank"
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-black text-xs gap-2"
                 >
                    <ExternalLink className="h-4 w-4" /> View Fullscreen
                 </a>
              </div>

              {doc.status === 'PENDING' && (
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black h-11"
                    onClick={() => updateDoc(doc.id, 'APPROVED')}
                  >
                    <Check className="h-4 w-4 mr-2" /> Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 rounded-xl font-black h-11"
                    onClick={() => updateDoc(doc.id, 'REJECTED')}
                  >
                    <X className="h-4 w-4 mr-2" /> Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
