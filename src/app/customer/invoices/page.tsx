"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Search,
  Printer,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { customerService } from "@/services/customer.service";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const data = await customerService.getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error("Failed to fetch invoices", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.booking.vendorprofile.businessName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Invoices</h1>
          <p className="text-sm text-slate-500">Download and manage your payment records</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search invoice or vendor..."
            className="pl-10 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
           {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
        </div>
      ) : filteredInvoices.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor & Booking</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {filteredInvoices.map((invoice) => (
                       <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                   <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-slate-900">{invoice.invoiceNumber}</p>
                                   <Badge className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-1.5 py-0 border-none">PAID</Badge>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <p className="text-sm font-bold text-slate-900">{invoice.booking.vendorprofile.businessName}</p>
                             <p className="text-[10px] text-slate-500 font-medium">#{invoice.booking.bookingNumber}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                             {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4">
                             <p className="text-sm font-black text-slate-900">₹{Number(invoice.booking.totalAmount).toLocaleString()}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                                   <Download className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                                   <Printer className="h-4 w-4" />
                                </Button>
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
           <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
           <h3 className="text-sm font-bold text-slate-900">No invoices found</h3>
           <p className="text-xs text-slate-500 mt-1">Invoices are generated after a payment is successful.</p>
        </div>
      )}

      {/* Payment Security */}
      <div className="flex items-center justify-center gap-8 py-10 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all duration-500">
         <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="text-xs font-black uppercase tracking-widest">PCI DSS Compliant</span>
         </div>
         <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="text-xs font-black uppercase tracking-widest">SSL Secure Payments</span>
         </div>
         <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="text-xs font-black uppercase tracking-widest">GST Invoice Ready</span>
         </div>
      </div>
    </div>
  );
}
