"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings2, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { vendorService } from "@/services/vendor.service";

export function ScheduleReportDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<{
    frequency: string;
    format: string;
    recipientEmail: string;
    reportTypes: string[];
    isActive: boolean;
  }>({
    frequency: "MONTHLY",
    format: "PDF",
    recipientEmail: "",
    reportTypes: ["bookings", "revenue"],
    isActive: true,
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchConfig();
    }
  }, [open]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await vendorService.getReportSchedule();
      if (data) {
        setConfig(data);
      }
    } catch {
      // Error logged or silent
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await vendorService.updateReportSchedule(config);
      toast({
        title: "Schedule Updated",
        description: "Your automated report preferences have been saved.",
      });
      setOpen(false);
    } catch {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not save schedule preferences.",
      });
    } finally {
      setSaving(false);
    }
  };


  const toggleReportType = (type: string) => {
    setConfig((prev) => ({
      ...prev,
      reportTypes: prev.reportTypes.includes(type)
        ? prev.reportTypes.filter((t) => t !== type)
        : [...prev.reportTypes, type],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/20 text-primary hover:bg-primary/5">
          <Settings2 className="h-4 w-4" />
          Schedule Reports
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tight">Automated Reporting</DialogTitle>
          <DialogDescription className="font-medium">
            Configure when and how you receive your business performance reports.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Loading Settings...</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Frequency</Label>
                <Select
                  value={config.frequency}
                  onValueChange={(v) => setConfig({ ...config, frequency: v })}
                >
                  <SelectTrigger className="rounded-xl h-12 font-bold">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="WEEKLY">Weekly (Every Monday)</SelectItem>
                    <SelectItem value="MONTHLY">Monthly (1st of Month)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Export Format</Label>
                <Select
                  value={config.format}
                  onValueChange={(v) => setConfig({ ...config, format: v })}
                >
                  <SelectTrigger className="rounded-xl h-12 font-bold">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="PDF">PDF Document</SelectItem>
                    <SelectItem value="EXCEL">Excel Spreadsheet</SelectItem>
                    <SelectItem value="BOTH">Both PDF & Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recipient Email</Label>
                <Input
                  type="email"
                  placeholder="Defaults to account email"
                  value={config.recipientEmail}
                  onChange={(e) => setConfig({ ...config, recipientEmail: e.target.value })}
                  className="rounded-xl h-12 font-bold"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Include Reports</Label>
                <div className="grid grid-cols-2 gap-4">
                  {["bookings", "revenue", "transactions", "withdrawals", "taxes"].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={config.reportTypes.includes(type)}
                        onCheckedChange={() => toggleReportType(type)}
                      />
                      <label
                        htmlFor={type}
                        className="text-xs font-bold uppercase tracking-tight cursor-pointer"
                      >
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button
              className="w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Save Configuration
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
