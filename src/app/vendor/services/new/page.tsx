"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Image as ImageIcon,
  MapPin,
  ChevronLeft,
  Check,
  Clock,
  Info,
  IndianRupee
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { marketplaceService } from "@/services/client";
import { vendorService } from "@/services/client";
import SuccessState from "@/components/common/SuccessState";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function NewServicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);

  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventTypeId: "",
    categoryId: "",
    subcategoryId: "",
    serviceTypeId: "",
    basePrice: "",
    discountPrice: "",
    minBookingAmount: "",
    location: "",
    city: "",
    state: "",
    capacity: "",
    cancellationPolicy: "Flexible: Full refund up to 7 days before the event.",
    features: ["Professional Equipment", "Experienced Staff"],
    images: [] as string[]
  });

  // Fetch Event Types
  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        const data = await marketplaceService.getEventTypes();
        setEventTypes(data);
      } catch {
        console.error("Failed to fetch event types");
      }
    };
    fetchEventTypes();
  }, []);

  // Fetch Categories when Event Type changes
  useEffect(() => {
    if (!formData.eventTypeId) {
      setCategories([]);
      return;
    }
    const fetchCategories = async () => {
      try {
        const data = await marketplaceService.getCategories(formData.eventTypeId);
        setCategories(data);
      } catch {
        console.error("Failed to fetch categories");
      }
    };
    fetchCategories();
  }, [formData.eventTypeId]);

  // Fetch Subcategories when Category changes
  useEffect(() => {
    if (!formData.categoryId) {
      setSubcategories([]);
      return;
    }
    const fetchSubcategories = async () => {
      try {
        const data = await marketplaceService.getSubcategories(formData.categoryId);
        setSubcategories(data);
      } catch {
        console.error("Failed to fetch subcategories");
      }
    };
    fetchSubcategories();
  }, [formData.categoryId]);

  // Fetch Service Types when Subcategory changes
  useEffect(() => {
    if (!formData.subcategoryId) {
      setServiceTypes([]);
      return;
    }
    const fetchServiceTypes = async () => {
      try {
        const data = await marketplaceService.getServiceTypes(formData.subcategoryId);
        setServiceTypes(data);
      } catch {
        console.error("Failed to fetch service types");
      }
    };
    fetchServiceTypes();
  }, [formData.subcategoryId]);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await vendorService.addService({
        ...formData,
        basePrice: Number(formData.basePrice),
        pricingType: "PACKAGE",
        images: formData.images
      });

      toast({ title: "Service Created!", description: "Your service is now live on the marketplace." });
      setIsSuccess(true);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create service."
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

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, data.secure_url]
      }));
      toast({ title: "Success", description: "Image uploaded successfully" });
    } catch {
      toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload image" });
    } finally {
      setLoading(false);
    }
  };


  if (isSuccess) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SuccessState
          title="Service Published!"
          message={`Your service "${formData.title}" has been successfully created and is now live on the marketplace.`}
          onContinue={() => router.push("/vendor/services")}
          continueText="View My Services"
          showHome={true}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" /> Back to Services
        </button>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={cn("h-1.5 w-12 rounded-full transition-all", step >= s ? "bg-primary" : "bg-muted")} />
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-[32px] overflow-hidden shadow-xl shadow-foreground/5">
        <div className="p-8 md:p-12">
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
                  <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Basic Information</h1>
                  <p className="text-muted-foreground font-medium">Start with the essentials of your service.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Service Title</Label>
                    <Input
                      placeholder="e.g. Premium Wedding Cinematography"
                      className="h-14 rounded-2xl border-border bg-muted/30 px-6 text-base font-bold focus:ring-primary/20"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Event Type</Label>
                      <select
                        className="w-full h-14 rounded-2xl border border-border bg-muted/30 px-6 text-base font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                        value={formData.eventTypeId}
                        onChange={(e) => setFormData({...formData, eventTypeId: e.target.value, categoryId: "", subcategoryId: "", serviceTypeId: ""})}
                      >
                        <option value="">Select Event Type</option>
                        {eventTypes.map(et => <option key={et.id} value={et.id}>{et.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Category</Label>
                      <select
                        className="w-full h-14 rounded-2xl border border-border bg-muted/30 px-6 text-base font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                        value={formData.categoryId}
                        onChange={(e) => setFormData({...formData, categoryId: e.target.value, subcategoryId: "", serviceTypeId: ""})}
                        disabled={!formData.eventTypeId}
                      >
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Subcategory</Label>
                      <select
                        className="w-full h-14 rounded-2xl border border-border bg-muted/30 px-6 text-base font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                        value={formData.subcategoryId}
                        onChange={(e) => setFormData({...formData, subcategoryId: e.target.value, serviceTypeId: ""})}
                        disabled={!formData.categoryId}
                      >
                        <option value="">Select Subcategory</option>
                        {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Service Type</Label>
                      <select
                        className="w-full h-14 rounded-2xl border border-border bg-muted/30 px-6 text-base font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                        value={formData.serviceTypeId}
                        onChange={(e) => setFormData({...formData, serviceTypeId: e.target.value})}
                        disabled={!formData.subcategoryId}
                      >
                        <option value="">Select Service Type</option>
                        {serviceTypes.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Description</Label>
                    <Textarea
                      placeholder="Describe your service in detail..."
                      className="min-h-[150px] rounded-2xl border-border bg-muted/30 px-6 py-4 text-base font-medium focus:ring-primary/20"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleNext} disabled={!formData.title || !formData.serviceTypeId} className="h-14 px-10 rounded-2xl bg-primary font-black uppercase tracking-widest shadow-lg shadow-primary/20 group">
                    Next Step <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
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
                  <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Pricing & Location</h1>
                  <p className="text-muted-foreground font-medium">Set your rates and service availability.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Base Price (₹)</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="h-14 rounded-2xl border-border bg-muted/30 pl-14 pr-6 text-base font-bold focus:ring-primary/20"
                        value={formData.basePrice}
                        onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Min. Booking Amount (₹)</Label>
                    <Input
                      type="number"
                      placeholder="Advance payment"
                      className="h-14 rounded-2xl border-border bg-muted/30 px-6 text-base font-bold focus:ring-primary/20"
                      value={formData.minBookingAmount}
                      onChange={(e) => setFormData({...formData, minBookingAmount: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Service Location (City)</Label>
                      <div className="relative">
                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="e.g. Hyderabad, Telangana"
                          className="h-14 rounded-2xl border-border bg-muted/30 pl-14 pr-6 text-base font-bold focus:ring-primary/20"
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex gap-4">
                      <div className="h-10 w-10 rounded-xl bg-white border border-border flex items-center justify-center shrink-0">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-primary uppercase tracking-widest">Cancellation Policy</p>
                        <p className="text-sm text-muted-foreground mt-1 font-medium">{formData.cancellationPolicy}</p>
                      </div>
                    </div>
                </div>

                <div className="flex justify-between">
                  <Button onClick={handleBack} variant="outline" className="h-14 px-10 rounded-2xl border-border font-black uppercase tracking-widest">
                    Go Back
                  </Button>
                  <Button onClick={handleNext} className="h-14 px-10 rounded-2xl bg-primary font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                    Next Step
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
                  <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Media & Review</h1>
                  <p className="text-muted-foreground font-medium">Add photos and publish your service.</p>
                </div>

                <div className="space-y-6">
                  <div className="relative border-2 border-dashed border-border rounded-[32px] p-12 text-center bg-muted/10 group hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer">
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileUpload}
                      disabled={loading}
                    />
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <ImageIcon className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Upload Service Media</h3>
                    <p className="text-sm text-muted-foreground font-medium mt-1">Drag and drop images or click to browse files.</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-4 uppercase font-black tracking-widest">JPG, PNG or WEBP • MAX 10MB</p>
                  </div>

                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      {formData.images.map((img, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border">
                          <Image src={img} alt={`Preview ${i}`} fill className="object-cover" />
                          <button
                            onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black"
                          >
                            <Plus className="h-3 w-3 rotate-45" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                     <h3 className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                       <Check className="h-4 w-4 text-success" /> Service Summary
                     </h3>
                     <div className="grid grid-cols-2 gap-y-4 text-sm">
                        <div className="text-muted-foreground font-medium">Title</div>
                        <div className="text-foreground font-black">{formData.title}</div>
                        <div className="text-muted-foreground font-medium">Base Price</div>
                        <div className="text-foreground font-black">₹{formData.basePrice}</div>
                        <div className="text-muted-foreground font-medium">Location</div>
                        <div className="text-foreground font-black">{formData.location}</div>
                     </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button onClick={handleBack} variant="outline" className="h-14 px-10 rounded-2xl border-border font-black uppercase tracking-widest">
                    Go Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    isLoading={loading}
                    className="h-14 px-12 rounded-2xl bg-success text-white font-black uppercase tracking-widest shadow-lg shadow-success/20 hover:bg-success/90"
                  >
                    Publish Service
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Help Card */}
      <div className="mt-8 bg-cta/5 border border-cta/20 rounded-[24px] p-6 flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-cta/10 flex items-center justify-center shrink-0">
          <Info className="h-5 w-5 text-cta" />
        </div>
        <div>
          <h4 className="text-sm font-black text-cta uppercase tracking-widest">Listing Guidelines</h4>
          <p className="text-xs text-muted-foreground font-bold mt-1 leading-relaxed">
            Ensure your titles are descriptive and your base price reflects your actual minimum starting rate.
            Services with accurate information have a 70% higher conversion rate.
          </p>
        </div>
      </div>
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
