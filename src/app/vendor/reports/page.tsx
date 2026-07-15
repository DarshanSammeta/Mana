"use client";

import { useState } from "react";
import {
  Download,
  FileText,
  FileSpreadsheet,
  Calendar as CalendarIcon,
  Filter,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Wallet,
  Receipt,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { vendorService } from "@/services/client";
import { useAuthStore } from "@/store/authStore";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { ReportsSkeleton } from "@/components/vendor/ReportsSkeleton";
import { ScheduleReportDialog } from "@/components/vendor/reports/ScheduleReportDialog";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const REPORT_TYPES = [
  {
    id: "bookings",
    label: "Bookings Report",
    icon: TrendingUp,
    color: "text-primary",
    bg: "bg-primary/10"
  },
  {
    id: "earnings",
    label: "Earnings & Payouts",
    icon: Wallet,
    color: "text-success",
    bg: "bg-success/10"
  },
  {
    id: "expenses",
    label: "Expenses Summary",
    icon: Receipt,
    color: "text-destructive",
    bg: "bg-destructive/10"
  },
  {
    id: "taxes",
    label: "Tax Statement",
    icon: CreditCard,
    color: "text-accent",
    bg: "bg-accent/10"
  }
];

export default function VendorReports() {
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState("bookings");
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const { isInitialized } = useAuthStore();
  const { toast } = useToast();

  if (!isInitialized) return <ReportsSkeleton />;

  const handleDownload = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      setLoading(true);
      const data = await vendorService.getReports({
        type: selectedReport,
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString()
      }) as Record<string, any>[];

      if (!data || data.length === 0) {
        toast({
          variant: "destructive",
          title: "No Data",
          description: "No records found for the selected period."
        });
        return;
      }

      if (format === 'excel' || format === 'csv') {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
        XLSX.writeFile(workbook, `ManaEvents_${selectedReport}_${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`);
      } else {
        const doc = new jsPDF();
        doc.text(`Mana Events - ${selectedReport.toUpperCase()} REPORT`, 14, 15);
        doc.text(`Period: ${dateRange.from.toLocaleDateString()} to ${dateRange.to.toLocaleDateString()}`, 14, 25);

        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          const rows = data.map((item) => headers.map(h => item[h]));
          (doc as any).autoTable({
            head: [headers],
            body: rows,
            startY: 35,
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235] }
          });
        } else {
          doc.text("No data found for the selected period.", 14, 35);
        }

        doc.save(`ManaEvents_${selectedReport}_${Date.now()}.pdf`);
      }

      toast({ title: "Report Generated", description: `Your ${selectedReport} report is ready.` });
    } catch (error) {
      console.error("Report generation error:", error);
      toast({ variant: "destructive", title: "Download Failed", description: "Could not generate report." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Business Analytics & Reports</h1>
        <p className="text-muted-foreground font-medium mt-1">Export your data for accounting, taxes, and performance review.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Report Selection */}
        <div className="space-y-4">
          <h2 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" /> Select Report Type
          </h2>
          <div className="space-y-2">
            {REPORT_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedReport(type.id)}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl border transition-all group",
                  selectedReport === type.id
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                    : "bg-card border-border text-foreground hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                    selectedReport === type.id ? "bg-white/20" : type.bg
                  )}>
                    <type.icon className={cn("h-5 w-5", selectedReport === type.id ? "text-white" : type.color)} />
                  </div>
                  <span className="font-bold text-sm tracking-tight">{type.label}</span>
                </div>
                <ArrowRight className={cn("h-4 w-4 opacity-0 group-hover:opacity-100 transition-all", selectedReport === type.id && "opacity-100")} />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Configuration & Download */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm space-y-8">
            <div className="space-y-4">
              <h2 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" /> Date Range Selection
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">From</label>
                  <input
                    type="date"
                    value={format(dateRange.from, 'yyyy-MM-dd')}
                    onChange={(e) => setDateRange({...dateRange, from: new Date(e.target.value)})}
                    className="w-full bg-muted/50 border border-border rounded-xl h-12 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">To</label>
                  <input
                    type="date"
                    value={format(dateRange.to, 'yyyy-MM-dd')}
                    onChange={(e) => setDateRange({...dateRange, to: new Date(e.target.value)})}
                    className="w-full bg-muted/50 border border-border rounded-xl h-12 px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {[
                  { label: "Today", days: 0 },
                  { label: "Last 7 Days", days: 7 },
                  { label: "Last 30 Days", days: 30 },
                  { label: "This Month", days: 'current' }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      if (preset.days === 'current') {
                        setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
                      } else {
                        setDateRange({ from: subDays(new Date(), preset.days as number), to: new Date() });
                      }
                    }}
                    className="px-3 py-1.5 bg-muted/50 border border-border rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:border-primary/30 transition-all"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-border space-y-4">
               <h2 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" /> Export Formats
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  disabled={loading}
                  onClick={() => handleDownload('pdf')}
                  className="flex flex-col items-center justify-center p-6 bg-card border border-border rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <FileText className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-widest">PDF Document</span>
                </button>
                <button
                  disabled={loading}
                  onClick={() => handleDownload('excel')}
                  className="flex flex-col items-center justify-center p-6 bg-card border border-border rounded-2xl hover:border-success/50 hover:bg-success/5 transition-all group"
                >
                  <FileSpreadsheet className="h-8 w-8 text-success mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-widest">Excel Sheet</span>
                </button>
                <button
                  disabled={loading}
                  onClick={() => handleDownload('csv')}
                  className="flex flex-col items-center justify-center p-6 bg-card border border-border rounded-2xl hover:border-accent/50 hover:bg-accent/5 transition-all group"
                >
                  <div className="h-8 w-8 rounded bg-accent/20 flex items-center justify-center text-accent font-black text-xs mb-2 group-hover:scale-110 transition-transform">CSV</div>
                  <span className="text-xs font-black uppercase tracking-widest">Flat CSV</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex gap-4">
            <AlertCircle className="h-6 w-6 text-primary shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-black text-primary uppercase tracking-widest">Automated Scheduling</p>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-3">
                Elite and Gold members can schedule monthly reports to be automatically sent to their registered email.
              </p>
              <ScheduleReportDialog />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
