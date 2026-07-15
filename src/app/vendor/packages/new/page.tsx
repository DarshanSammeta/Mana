"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ChevronLeft,
  Check,
  Info,
  IndianRupee,
  Layers,
  Percent,
  Calculator,
  Trash2,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { vendorService } from "@/services/client";
import SuccessState from "@/components/common/SuccessState";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface PricingRule {
    minGuests: number;
    maxGuests: number;
    pricePerGuest: number;
    flatFee: number;
}

export default function NewPackagePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<any[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    serviceId: "",
    name: "",
    description: "",
    price: "",
    features: [] as string[],
    inclusions: [] as string[],
    exclusions: [] as string[],
    discount: "0",
    taxes: "0",
    images: [] as string[],
    pricingRules: [] as PricingRule[]
  });

  const [newFeature, setNewFeature] = useState("");
  const [newInclusion, setNewInclusion] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await vendorService.getServices();
        setServices(data || []);
      } catch {
        console.error("Failed to fetch services");
      }
    };
    fetchServices();
  }, []);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await vendorService.addPackage({
        ...formData,
        price: Number(formData.price),
        discount: Number(formData.discount),
        taxes: Number(formData.taxes),
        pricingRules: formData.pricingRules.map(rule => ({
            ...rule,
            minGuests: Number(rule.minGuests),
            maxGuests: Number(rule.maxGuests),
            pricePerGuest: Number(rule.pricePerGuest),
            flatFee: Number(rule.flatFee)
        }))
      });

      toast({ title: "Package Created!", description: "Tiered pricing added successfully." });
      setIsSuccess(true);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to create package."
      });
    } finally {
      setLoading(false);
    }
  };

  const addPricingRule = () => {
    setFormData(prev => ({
        ...prev,
        pricingRules: [...prev.pricingRules, { minGuests: 0, maxGuests: 0, pricePerGuest: 0, flatFee: 0 }]
    }));
  };

  const updatePricingRule = (index: number, field: keyof PricingRule, value: string) => {
    const updatedRules = [...formData.pricingRules];
    updatedRules[index] = { ...updatedRules[index], [field]: Number(value) };
    setFormData(prev => ({ ...prev, pricingRules: updatedRules }));
  };

  const removePricingRule = (index: number) => {
    setFormData(prev => ({
        ...prev,
        pricingRules: prev.pricingRules.filter((_, i) => i !== index)
    }));
  };

  if (isSuccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SuccessState
          title="Package Created!"
          message={`Your package "${formData.name}" is now active and ready for bookings.`}
          onContinue={() => router.push("/vendor/packages")}
          continueText="Manage All Packages"
          showHome={true}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back to Packages
        </button>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={cn("h-1.5 w-12 rounded-full transition-all", step >= s ? "bg-primary" : "bg-muted")} />
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-[32px] overflow-hidden shadow-xl">
        <div className="p-8 md:p-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Package Fundamentals</h1>
                  <p className="text-muted-foreground font-medium">Link this package to a service and define the core details.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Select Parent Service</Label>
                    <select
                      className="w-full h-14 rounded-2xl border border-border bg-muted/30 px-6 text-base font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                      value={formData.serviceId}
                      onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
                    >
                      <option value="">Choose Service</option>
                      {services.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Package Name</Label>
                    <Input
                      placeholder="e.g. Premium Wedding Buffet (Gold)"
                      className="h-14 rounded-2xl bg-muted/30 px-6 text-base font-bold"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Description</Label>
                    <Textarea
                      placeholder="What makes this tier special? (Optional)"
                      className="min-h-[120px] rounded-2xl bg-muted/30 px-6 py-4"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleNext} disabled={!formData.serviceId || !formData.name} className="h-14 px-10 rounded-2xl bg-primary font-black uppercase tracking-widest shadow-lg">
                    Pricing Config <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Pricing & Dynamic Rules</h1>
                    <p className="text-muted-foreground font-medium">Define base rates and guest-based pricing logic.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Base Price (₹)</Label>
                        <div className="relative">
                            <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="number"
                                className="h-14 rounded-2xl bg-muted/30 pl-14 font-bold"
                                value={formData.price}
                                onChange={(e) => setFormData({...formData, price: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tax (%)</Label>
                        <div className="relative">
                            <Percent className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="number"
                                className="h-14 rounded-2xl bg-muted/30 pl-14 font-bold"
                                value={formData.taxes}
                                onChange={(e) => setFormData({...formData, taxes: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Discount (₹)</Label>
                        <Input
                            type="number"
                            className="h-14 rounded-2xl bg-muted/30 px-6 font-bold"
                            value={formData.discount}
                            onChange={(e) => setFormData({...formData, discount: e.target.value})}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Guest-Based Pricing Rules</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addPricingRule} className="h-8 rounded-lg border-primary text-primary font-bold hover:bg-primary/5">
                            <Plus className="h-3.5 w-3.5 mr-1" /> Add Rule
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {formData.pricingRules.length === 0 && (
                            <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center text-muted-foreground bg-muted/10">
                                <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm font-bold">No dynamic rules added</p>
                                <p className="text-xs">Add rules to automatically calculate price based on guest count.</p>
                            </div>
                        )}
                        {formData.pricingRules.map((rule, idx) => (
                            <div key={idx} className="bg-muted/30 border border-border rounded-2xl p-4 grid grid-cols-2 md:grid-cols-5 gap-3 items-end relative group">
                                <button onClick={() => removePricingRule(idx)} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                    <Trash2 className="h-3 w-3" />
                                </button>
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Min Guests</Label>
                                    <Input type="number" value={rule.minGuests} onChange={(e) => updatePricingRule(idx, 'minGuests', e.target.value)} className="h-10 rounded-xl" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Max Guests</Label>
                                    <Input type="number" value={rule.maxGuests} onChange={(e) => updatePricingRule(idx, 'maxGuests', e.target.value)} className="h-10 rounded-xl" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground">₹ Per Guest</Label>
                                    <Input type="number" value={rule.pricePerGuest} onChange={(e) => updatePricingRule(idx, 'pricePerGuest', e.target.value)} className="h-10 rounded-xl" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Flat Fee (₹)</Label>
                                    <Input type="number" value={rule.flatFee} onChange={(e) => updatePricingRule(idx, 'flatFee', e.target.value)} className="h-10 rounded-xl" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-10 w-full bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-center text-[10px] font-black text-primary">
                                        DYNAMIC RULE
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-between">
                  <Button onClick={handleBack} variant="outline" className="h-14 px-10 rounded-2xl border-border font-black uppercase tracking-widest">
                    Back
                  </Button>
                  <Button onClick={handleNext} className="h-14 px-10 rounded-2xl bg-primary font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                    Deliverables <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Inclusions & Features</h1>
                  <p className="text-muted-foreground font-medium">Detail exactly what the customer gets in this package.</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Package Deliverables (Inclusions)</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="e.g. 5 Course Meal, High-Res Digital Album..."
                                className="h-12 rounded-xl bg-muted/30"
                                value={newInclusion}
                                onChange={(e) => setNewInclusion(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), newInclusion && (setFormData(prev => ({...prev, inclusions: [...prev.inclusions, newInclusion]})), setNewInclusion("")))}
                            />
                            <Button type="button" onClick={() => newInclusion && (setFormData(prev => ({...prev, inclusions: [...prev.inclusions, newInclusion]})), setNewInclusion(""))} className="h-12 w-12 rounded-xl bg-slate-900">
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.inclusions.map((item, i) => (
                                <div key={i} className="bg-primary/5 border border-primary/20 rounded-full px-4 py-1.5 text-sm font-bold text-primary flex items-center gap-2">
                                    <Check className="h-3.5 w-3.5" />
                                    {item}
                                    <button onClick={() => setFormData(prev => ({...prev, inclusions: prev.inclusions.filter((_, idx) => idx !== i)}))} className="hover:text-destructive">
                                        <Plus className="h-3 w-3 rotate-45" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Unique Features</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="e.g. Free Drone Coverage, Live Pasta Counter..."
                                className="h-12 rounded-xl bg-muted/30"
                                value={newFeature}
                                onChange={(e) => setNewFeature(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), newFeature && (setFormData(prev => ({...prev, features: [...prev.features, newFeature]})), setNewFeature("")))}
                            />
                            <Button type="button" onClick={() => newFeature && (setFormData(prev => ({...prev, features: [...prev.features, newFeature]})), setNewFeature(""))} className="h-12 w-12 rounded-xl bg-slate-900">
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.features.map((item, i) => (
                                <div key={i} className="bg-slate-100 border border-slate-200 rounded-full px-4 py-1.5 text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <Layers className="h-3.5 w-3.5" />
                                    {item}
                                    <button onClick={() => setFormData(prev => ({...prev, features: prev.features.filter((_, idx) => idx !== i)}))} className="hover:text-destructive">
                                        <Plus className="h-3 w-3 rotate-45" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between pt-6">
                  <Button onClick={handleBack} variant="outline" className="h-14 px-10 rounded-2xl border-border font-black uppercase tracking-widest">
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    isLoading={loading}
                    className="h-14 px-12 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95"
                  >
                    Create Package
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-8 bg-primary/5 border border-primary/20 rounded-[24px] p-6 flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
          <Info className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h4 className="text-sm font-black text-primary uppercase tracking-widest">Enterprise Tip</h4>
          <p className="text-xs text-muted-foreground font-bold mt-1 leading-relaxed">
            Tiered packages (Basic, Premium, Luxury) allow you to capture a wider range of customers.
            Ensure each tier has clearly distinct value propositions.
          </p>
        </div>
      </div>
    </div>
  );
}
