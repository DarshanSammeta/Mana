"use client";

import { useState, useEffect, use, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronLeft } from "lucide-react";
import { vendorService } from "@/services/client";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function ServicePackages({ params }: { params: Promise<{ id: string }> }) {
  const { id: serviceId } = use(params);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [newPackage, setNewPackage] = useState({
    name: "",
    description: "",
    price: "",
    inclusions: "",
    exclusions: "",
  });

  const fetchPackages = useCallback(async () => {
    try {
      const data = await vendorService.getPackages(serviceId);
      setPackages(data);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch packages" });
    } finally {
      setLoading(false);
    }
  }, [serviceId, toast]);

  useEffect(() => {
    fetchPackages();
  }, [serviceId, fetchPackages]);

  const handleAddPackage = async () => {
    try {
      setLoading(true);
      await vendorService.addPackage({
        ...newPackage,
        serviceId,
        inclusions: newPackage.inclusions.split("\n").filter(i => i),
        exclusions: newPackage.exclusions.split("\n").filter(e => e),
      });
      toast({ title: "Success", description: "Package added successfully" });
      fetchPackages();
      setNewPackage({ name: "", description: "", price: "", inclusions: "", exclusions: "" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to add package" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await vendorService.deletePackage(id);
      toast({ title: "Success", description: "Package deleted" });
      fetchPackages();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Delete failed" });
    }
  };


  return (
    <div className="space-y-10">
      <div className="flex items-center gap-6">
        <Link href="/vendor/services">
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div>
          <h2 className="text-4xl font-black tracking-tight">Service Packages</h2>
          <p className="text-muted-foreground text-lg mt-1">Configure your tiered offerings and pricing models.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Dialog>
          <DialogTrigger asChild>
            <button className="border-2 border-dashed border-border rounded-[2.5rem] p-10 flex flex-col items-center justify-center gap-4 hover:bg-secondary/30 hover:border-primary/50 transition-all group h-[450px]">
              <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-primary group-hover:text-white">
                <Plus className="h-8 w-8 text-primary group-hover:text-white" />
              </div>
              <div className="text-center">
                <p className="font-black text-xl">Create New Tier</p>
                <p className="text-sm text-muted-foreground font-medium mt-1">Add a pricing variant</p>
              </div>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] rounded-[2.5rem]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Create Service Tier</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6 py-4">
              <div className="col-span-2 space-y-2">
                <Label className="font-bold text-sm">Package Name</Label>
                <Input
                  className="rounded-xl h-12"
                  placeholder="e.g. Premium Wedding Package"
                  value={newPackage.name}
                  onChange={(e) => setNewPackage({...newPackage, name: e.target.value})}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="font-bold text-sm">Detailed Description</Label>
                <Textarea
                  className="rounded-xl min-h-[100px]"
                  placeholder="Explain what makes this tier unique..."
                  value={newPackage.description}
                  onChange={(e) => setNewPackage({...newPackage, description: e.target.value})}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label className="font-bold text-sm">Tier Price (₹)</Label>
                <Input
                  className="rounded-xl h-12"
                  type="number"
                  placeholder="25000"
                  value={newPackage.price}
                  onChange={(e) => setNewPackage({...newPackage, price: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-sm">Inclusions (per line)</Label>
                <Textarea
                  className="rounded-xl min-h-[120px]"
                  placeholder="List all features..."
                  value={newPackage.inclusions}
                  onChange={(e) => setNewPackage({...newPackage, inclusions: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-sm">Exclusions (per line)</Label>
                <Textarea
                  className="rounded-xl min-h-[120px]"
                  placeholder="Mention what's not included..."
                  value={newPackage.exclusions}
                  onChange={(e) => setNewPackage({...newPackage, exclusions: e.target.value})}
                />
              </div>
              <Button
                size="lg"
                variant="premium"
                className="col-span-2 rounded-2xl h-14 font-black mt-2"
                onClick={handleAddPackage}
                isLoading={loading}
              >
                Publish Tier
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {loading ? (
          [1, 2].map(i => (
              <Skeleton key={i} className="rounded-[2.5rem] h-[450px]" />
          ))
        ) : (
          packages.map((pkg) => (
            <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[2.5rem] p-8 flex flex-col h-[450px] group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-2xl font-black group-hover:text-primary transition-colors">{pkg.name}</h3>
                    <p className="text-3xl font-black text-foreground mt-2 tracking-tight">₹ {Number(pkg.price).toLocaleString('en-IN')}</p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-rose-500 hover:bg-rose-500/10 transition-colors"
                    onClick={() => handleDeletePackage(pkg.id)}
                >
                    <Trash2 className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                <div>
                    <p className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-3">Tier Overview</p>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">{pkg.description}</p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase text-primary tracking-widest mb-3">What&apos;s Included</p>
                  <ul className="space-y-3">
                    {Array.isArray(pkg.inclusions) && pkg.inclusions.map((inc: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm font-bold text-foreground">
                        <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </div>
                        {inc}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-dashed">
                <Button variant="outline" className="w-full rounded-xl font-bold h-12">Edit Details</Button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
