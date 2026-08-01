"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Image as ImageIcon,
  ChevronLeft,
  Check,
  Info,
  IndianRupee,
  Users,
  Trash2,
  Loader2,
  Save,
  Globe,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { vendorService } from "@/services/client";
import SuccessState from "@/components/common/SuccessState";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function NewServicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<any[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    serviceTypeId: "",
    basePrice: "",
    discountPrice: "",
    advancePercentage: "30",
    duration: "4 Hours",
    maxGuests: "200",
    cancellationPolicy: "Flexible: Full refund up to 7 days before the event.",
    serviceRadius: "50",
    citiesServed: [] as string[],
    features: ["Professional Equipment", "On-site support"],
    images: [] as string[],
    availableDays: [1, 2, 3, 4, 5, 6],
    startTime: "09:00",
    endTime: "21:00",
  });

  const [newFeature, setNewFeature] = useState("");
  const [newCity, setNewCity] = useState("");

  // Fetch Categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setFetchingCategories(true);
        const data = await vendorService.getCategories();
        setCategories(data);
      } catch {
        toast({ variant: "destructive", title: "Fetch Error", description: "Could not load service categories." });
      } finally {
        setFetchingCategories(false);
      }
    };
    loadCategories();
  }, [toast]);

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};
    if (currentStep === 1) {
      if (formData.title.length < 5) newErrors.title = "Title must be at least 5 characters.";
      if (formData.description.length < 20) newErrors.description = "Description must be at least 20 characters.";
      if (!formData.categoryId) newErrors.categoryId = "Please select a category.";
      if (!formData.serviceTypeId) newErrors.serviceTypeId = "Please select a specific service type.";
    }
    if (currentStep === 2) {
      if (!formData.basePrice || Number(formData.basePrice) <= 0) newErrors.basePrice = "Valid price required.";
    }
    if (currentStep === 3) {
      if (!formData.serviceRadius || Number(formData.serviceRadius) <= 0) newErrors.serviceRadius = "Service radius must be greater than 0.";
      if (formData.citiesServed.length === 0) newErrors.citiesServed = "Please add at least one city.";
    }
    if (currentStep === 4) {
      if (formData.images.length < 3) newErrors.images = "Minimum 3 portfolio images are required for visibility.";
      if (formData.features.length === 0) newErrors.features = "Add at least one highlight/feature.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAllSteps = () => {
    const validationLog = {
      title: formData.title.length >= 5,
      description: formData.description.length >= 20,
      category: !!formData.categoryId,
      serviceType: !!formData.serviceTypeId,
      price: Number(formData.basePrice) > 0,
      coverage: formData.citiesServed.length > 0 && Number(formData.serviceRadius) > 0,
      images: formData.images.length >= 3,
      highlights: formData.features.length > 0,
      imagesCount: formData.images.length
    };

    console.log("[Service Wizard Audit] Full Validation State:", validationLog);

    for (let i = 1; i <= 4; i++) {
        if (!validateStep(i)) {
            console.error(`[Service Wizard Audit] Step ${i} failed validation. Stopping submission.`);
            setStep(i); // Redirect to the failing step
            return false;
        }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(prev => prev + 1);
  };

  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async (publish: boolean = true) => {
    if (publish && !validateAllSteps()) {
      toast({
        variant: "destructive",
        title: "Incomplete Details",
        description: "Please check all steps. Minimum 3 images and all required fields are mandatory for publishing."
      });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        basePrice: Number(formData.basePrice),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
        advancePercentage: Number(formData.advancePercentage),
        maxGuests: Number(formData.maxGuests),
        serviceRadius: Number(formData.serviceRadius),
        isDraft: !publish,
        features: formData.features.map(f => f.trim()).filter(Boolean),
        images: formData.images
      };

      console.log("[Service Wizard Audit] Sending Payload:", payload);

      await vendorService.addService(payload);

      toast({ title: publish ? "Service Published!" : "Draft Saved", description: "Successfully updated your catalog." });
      setIsSuccess(true);
    } catch (err: any) {
      console.error("[Service Wizard Audit] Submission Error:", err.response?.data);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: err.response?.data?.message || "An error occurred while saving."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const data = await vendorService.uploadMedia(file);
      setFormData(prev => ({ ...prev, images: [...prev.images, data.secure_url] }));
      toast({ title: "Image Uploaded", description: "Your gallery has been updated." });
    } catch {
      toast({ variant: "destructive", title: "Upload Failed", description: "Could not process image." });
    } finally {
      setLoading(false);
    }
  };

  const addCity = () => {
    if (newCity.trim() && !formData.citiesServed.includes(newCity.trim())) {
      setFormData(prev => ({ ...prev, citiesServed: [...prev.citiesServed, newCity.trim()] }));
      setNewCity("");
    }
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const activeCategory = categories.find(c => c.id === formData.categoryId);
  const flattenedServiceTypes = activeCategory?.subcategory?.flatMap((s: any) => s.servicetype) || [];

  if (isSuccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SuccessState
          title="Service Listing Created!"
          message={`Your service "${formData.title}" is now active and live on the marketplace.`}
          onContinue={() => router.push("/vendor/services")}
          continueText="View Listings"
          showHome={true}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-40 pt-4">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-10 px-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Exit Setup
        </button>
        <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Onboarding Progress</span>
            <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((s) => (
                    <div key={s} className={cn("h-1.5 w-12 rounded-full transition-all", step >= s ? "bg-primary" : "bg-muted")} />
                ))}
            </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-[48px] overflow-hidden shadow-2xl shadow-foreground/5">
        <div className="p-8 md:p-14">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                <div className="space-y-2">
                  <h1 className="text-4xl font-black text-foreground tracking-tight uppercase italic">General Info</h1>
                  <p className="text-muted-foreground font-medium text-lg italic">How should your service appear to customers?</p>
                </div>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Listing Title</Label>
                    <Input
                      placeholder="e.g. Traditional South Indian Wedding Catering"
                      className={cn("h-16 rounded-2xl border-border bg-muted/20 px-6 text-xl font-bold placeholder:opacity-50", errors.title && "border-destructive")}
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                    {errors.title && <p className="text-xs text-destructive font-black uppercase tracking-widest">{errors.title}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Category</Label>
                      <select
                        className="w-full h-16 rounded-2xl border border-border bg-muted/20 px-6 text-base font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                        value={formData.categoryId}
                        onChange={(e) => setFormData({...formData, categoryId: e.target.value, serviceTypeId: ""})}
                      >
                        <option value="">Select industry...</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      {fetchingCategories && <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-muted-foreground animate-pulse"><Loader2 className="h-3 w-3 animate-spin" /> Fetching categories...</div>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Service Type</Label>
                      <select
                        disabled={!formData.categoryId}
                        className="w-full h-16 rounded-2xl border border-border bg-muted/20 px-6 text-base font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none disabled:opacity-30"
                        value={formData.serviceTypeId}
                        onChange={(e) => setFormData({...formData, serviceTypeId: e.target.value})}
                      >
                        <option value="">Select specialization...</option>
                        {flattenedServiceTypes.map((st: any) => <option key={st.id} value={st.id}>{st.name}</option>)}
                      </select>
                      {!formData.categoryId && <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 opacity-60">Please select a category first</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Service Description</Label>
                    <Textarea
                      placeholder="Be detailed. What equipment do you use? What is the crew size? Why should they book you?"
                      className="min-h-[200px] rounded-[32px] border-border bg-muted/20 px-8 py-6 text-base font-medium leading-relaxed"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                    {errors.description && <p className="text-xs text-destructive font-black uppercase tracking-widest">{errors.description}</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                 <div className="space-y-2">
                  <h1 className="text-4xl font-black text-foreground tracking-tight uppercase italic">Pricing & Milestones</h1>
                  <p className="text-muted-foreground font-medium text-lg italic">Set your starting rates and payment terms.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-3">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Base Starting Price</Label>
                        <div className="relative">
                            <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="number"
                                className="h-16 rounded-2xl border-border bg-muted/20 pl-16 pr-6 text-2xl font-black"
                                value={formData.basePrice}
                                onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
                            />
                        </div>
                   </div>
                   <div className="space-y-3">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Advance Amount (%)</Label>
                        <select
                            className="w-full h-16 rounded-2xl border border-border bg-muted/20 px-6 text-xl font-black focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                            value={formData.advancePercentage}
                            onChange={(e) => setFormData({...formData, advancePercentage: e.target.value})}
                        >
                            <option value="10">10% - High Trust</option>
                            <option value="20">20% - Standard</option>
                            <option value="30">30% - Recommended</option>
                            <option value="50">50% - Custom / High Value</option>
                        </select>
                   </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-[32px] p-8 space-y-4">
                    <div className="flex items-center gap-3">
                        <Info className="h-5 w-5 text-primary" />
                        <h4 className="font-black uppercase text-xs tracking-widest text-primary">Pricing Logic</h4>
                    </div>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                        The base price is the minimum amount a customer will pay to book you. For complex services, you can add more detailed pricing plans (Packages) later in the service management portal.
                    </p>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                 <div className="space-y-2">
                  <h1 className="text-4xl font-black text-foreground tracking-tight uppercase italic">Service Coverage</h1>
                  <p className="text-muted-foreground font-medium text-lg italic">Where can you deliver this service?</p>
                </div>

                <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Operating Radius (km)</Label>
                            <div className="relative">
                                <Globe className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    type="number"
                                    className="h-16 rounded-2xl border-border bg-muted/20 pl-16 pr-6 text-xl font-black"
                                    value={formData.serviceRadius}
                                    onChange={(e) => setFormData({...formData, serviceRadius: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Max Guests Supported</Label>
                            <div className="relative">
                                <Users className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    type="number"
                                    className="h-16 rounded-2xl border-border bg-muted/20 pl-16 pr-6 text-xl font-black"
                                    value={formData.maxGuests}
                                    onChange={(e) => setFormData({...formData, maxGuests: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Primary Operation Cities</Label>
                        <div className="flex gap-4">
                            <Input
                                placeholder="Add a city (e.g. Hyderabad)"
                                className="h-16 rounded-2xl border-border bg-muted/20 px-6 font-bold flex-1"
                                value={newCity}
                                onChange={(e) => setNewCity(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addCity()}
                            />
                            <Button onClick={addCity} type="button" className="h-16 w-16 rounded-2xl bg-slate-900 text-white"><Plus className="h-6 w-6" /></Button>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-4">
                            {formData.citiesServed.map((city, i) => (
                                <div key={i} className="flex items-center gap-2 pl-4 pr-2 py-2 bg-slate-100 border border-slate-200 rounded-xl">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-600">{city}</span>
                                    <button onClick={() => setFormData(p => ({...p, citiesServed: p.citiesServed.filter((_, idx) => idx !== i)}))} className="p-1 hover:bg-slate-200 rounded-md transition-colors"><X className="h-3 w-3" /></button>
                                </div>
                            ))}
                            {formData.citiesServed.length === 0 && <p className="text-xs text-muted-foreground font-bold italic ml-2">No cities added yet. Type a name and press Enter.</p>}
                        </div>
                    </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                 <div className="space-y-2">
                  <h1 className="text-4xl font-black text-foreground tracking-tight uppercase italic">Portfolio & Highlights</h1>
                  <p className="text-muted-foreground font-medium text-lg italic">Visual proof of your service quality.</p>
                </div>

                <div className="space-y-10">
                    <div className="relative border-4 border-dashed border-border rounded-[40px] p-16 text-center bg-muted/5 group hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer">
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} disabled={loading} />
                        <div className="h-20 w-20 rounded-[24px] bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <ImageIcon className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight italic">Drag & Drop HD Photos</h3>
                        <p className="text-muted-foreground font-medium mt-1">Upload at least 3 photos for best visibility.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-6">
                        {formData.images.map((img, i) => (
                            <div key={i} className="relative aspect-video rounded-3xl overflow-hidden border-2 border-border shadow-sm group">
                                <Image src={img} alt="Preview" fill className="object-cover group-hover:scale-105 transition-transform" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button onClick={() => setFormData(p => ({...p, images: p.images.filter((_, idx) => idx !== i)}))} className="p-3 bg-destructive text-white rounded-2xl shadow-xl hover:scale-110 transition-transform"><Trash2 className="h-5 w-5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-1">Key Highlights (Bullets)</Label>
                        <div className="flex gap-4">
                            <Input
                                placeholder="e.g. 4K Video Quality, Instant Delivery..."
                                className="h-16 rounded-2xl border-border bg-muted/20 px-6 font-bold flex-1"
                                value={newFeature}
                                onChange={(e) => setNewFeature(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                            />
                            <Button onClick={addFeature} type="button" className="h-16 w-16 rounded-2xl bg-primary text-white"><Plus className="h-6 w-6" /></Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                            {formData.features.map((feature, i) => (
                                <div key={i} className="flex items-center justify-between p-5 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-7 w-7 rounded-full bg-success/10 flex items-center justify-center text-success"><Check className="h-4 w-4" /></div>
                                        <span className="text-sm font-black text-slate-700 italic">{feature}</span>
                                    </div>
                                    <button onClick={() => removeFeature(i)} className="p-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* STICKY FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/60 backdrop-blur-2xl border-t border-border p-8 z-50 shadow-[0_-20px_40px_rgba(0,0,0,0.02)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-10">
            <div className="hidden md:block">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2 italic">Creation Stage {step} of 4</p>
                <div className="flex gap-2">
                    {[1,2,3,4].map(s => <div key={s} className={cn("h-1.5 w-8 rounded-full transition-all", step >= s ? "bg-primary" : "bg-muted")} />)}
                </div>
            </div>

            <div className="flex items-center gap-4 flex-1 md:flex-none justify-end">
                {step > 1 && (
                    <Button onClick={handleBack} variant="ghost" className="rounded-2xl h-16 px-10 font-black uppercase tracking-widest text-slate-400">Back</Button>
                )}
                <Button
                    onClick={() => handleSubmit(false)}
                    disabled={loading}
                    variant="outline"
                    className="hidden sm:flex rounded-2xl h-16 px-10 font-black uppercase tracking-widest gap-3 border-slate-200 hover:bg-slate-50"
                >
                    <Save className="h-5 w-5" /> Save Draft
                </Button>
                {step < 4 ? (
                    <Button onClick={handleNext} className="rounded-2xl h-16 px-14 bg-primary text-white font-black uppercase tracking-widest gap-3 group shadow-xl shadow-primary/20">
                        Continue Setup <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                ) : (
                    <Button
                        onClick={() => handleSubmit(true)}
                        disabled={loading || formData.images.length < 3}
                        className="rounded-2xl h-16 px-14 bg-success text-white font-black uppercase tracking-widest gap-3 shadow-xl shadow-success/20 hover:scale-105 transition-transform"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Globe className="h-5 w-5" />} Go Live Now
                    </Button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}
