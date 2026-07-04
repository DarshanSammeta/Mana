"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  MapPin,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { vendorService } from "@/services/vendor.service";
import { marketplaceService } from "@/services/marketplace.service";
import SuccessState from "@/components/common/SuccessState";

const STEPS = [
  { id: "business", title: "Business Info", icon: Store },
  { id: "location", title: "Service Area", icon: MapPin },
  { id: "details", title: "Business Details", icon: Building2 },
  { id: "payout", title: "Bank Details", icon: CreditCard },
];

export default function VendorOnboarding() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    businessName: "",
    description: "",
    businessType: "Individual",
    categoryId: "",
    subcategoryIds: [] as string[],
    address: "",
    city: "",
    state: "",
    zipCode: "",
    serviceRadius: "20",
    gstNumber: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    contactPerson: user?.fullName || "",
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await marketplaceService.getCategories();
        setCategories(data || []);
      } catch {
        console.error("Failed to fetch categories");
      }
    };
    fetchCategories();
  }, []);

  const updateFormData = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubcategoryToggle = (subId: string) => {
    setFormData(prev => ({
      ...prev,
      subcategoryIds: prev.subcategoryIds.includes(subId)
        ? prev.subcategoryIds.filter(id => id !== subId)
        : [...prev.subcategoryIds, subId]
    }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Update Profile using vendorService
      await vendorService.updateProfile({
        ...formData,
        serviceRadius: parseFloat(formData.serviceRadius),
        bankDetails: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode
        }
      });

      // 2. Profile updated successfully
      setIsSuccess(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <SuccessState
          title="Onboarding Complete!"
          message="Your business profile has been successfully set up. You can now start adding services and receiving bookings."
          onContinue={() => router.push("/vendor/dashboard")}
          continueText="Go to Dashboard"
          showHome={false}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-purple-950 text-white py-4 px-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight">mana<span className="text-purple-400">Events</span></span>
          <span className="text-xs bg-purple-800 px-2 py-0.5 rounded text-purple-200">Seller Central</span>
        </div>
        <div className="text-sm font-medium text-purple-200">
          Setup Progress: {Math.round(((currentStep + 1) / STEPS.length) * 100)}%
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-3xl">
          {/* Progress Bar */}
          <div className="flex justify-between mb-12 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
            {STEPS.map((step, idx) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  idx <= currentStep ? "bg-purple-600 border-purple-600 text-white shadow-lg" : "bg-white border-gray-300 text-gray-400"
                }`}>
                  {idx < currentStep ? <CheckCircle2 className="h-6 w-6" /> : <step.icon className="h-5 w-5" />}
                </div>
                <span className={`text-[10px] font-bold uppercase mt-2 tracking-wider ${idx <= currentStep ? "text-purple-900" : "text-gray-400"}`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {currentStep === 0 && (
                    <>
                      <div className="border-b border-gray-100 pb-4 mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Setup your business profile</h2>
                        <p className="text-sm text-gray-500">Tell customers about what you offer.</p>
                      </div>
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="businessName" className="font-bold">Business Name</Label>
                          <Input name="businessName" value={formData.businessName} onChange={updateFormData} placeholder="e.g. Royal Wedding Photography" className="h-11" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description" className="font-bold">Business Description</Label>
                          <Textarea name="description" value={formData.description} onChange={updateFormData} placeholder="Describe your experience and specialty..." className="min-h-[120px]" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="businessType" className="font-bold">Business Type</Label>
                          <select name="businessType" value={formData.businessType} onChange={(e) => updateFormData(e as any)} className="h-11 border border-gray-300 rounded-md px-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none">
                            <option>Individual</option>
                            <option>Private Limited</option>
                            <option>Partnership</option>
                            <option>Proprietorship</option>
                          </select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="categoryId" className="font-bold">Primary Category</Label>
                          <select
                            name="categoryId"
                            value={formData.categoryId}
                            onChange={(e) => {
                              updateFormData(e as any);
                              setFormData(prev => ({ ...prev, subcategoryIds: [] }));
                            }}
                            className="h-11 border border-gray-300 rounded-md px-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                          >
                            <option value="">Select Category</option>
                            {categories.map((cat: any) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>

                        {formData.categoryId && (
                          <div className="grid gap-2">
                            <Label className="font-bold">Services You Provide</Label>
                            <div className="grid grid-cols-2 gap-2">
                              {categories.find(c => c.id === formData.categoryId)?.subcategory?.map((sub: any) => (
                                <div
                                  key={sub.id}
                                  onClick={() => handleSubcategoryToggle(sub.id)}
                                  className={`p-3 border rounded-md cursor-pointer transition-all text-sm flex items-center gap-2 ${
                                    formData.subcategoryIds.includes(sub.id)
                                      ? "border-purple-600 bg-purple-50 text-purple-700 font-bold"
                                      : "border-gray-200 hover:border-gray-300"
                                  }`}
                                >
                                  <div className={`h-4 w-4 rounded-sm border flex items-center justify-center ${
                                    formData.subcategoryIds.includes(sub.id) ? "bg-purple-600 border-purple-600" : "border-gray-300"
                                  }`}>
                                    {formData.subcategoryIds.includes(sub.id) && <CheckCircle2 className="h-3 w-3 text-white" />}
                                  </div>
                                  {sub.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {currentStep === 1 && (
                    <>
                      <div className="border-b border-gray-100 pb-4 mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Service Location</h2>
                        <p className="text-sm text-gray-500">Where do you provide your services?</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 grid gap-2">
                          <Label htmlFor="address" className="font-bold">Full Address</Label>
                          <Input name="address" value={formData.address} onChange={updateFormData} placeholder="Office or Home Studio address" className="h-11" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="city" className="font-bold">City</Label>
                          <Input name="city" value={formData.city} onChange={updateFormData} placeholder="Mumbai" className="h-11" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="state" className="font-bold">State</Label>
                          <Input name="state" value={formData.state} onChange={updateFormData} placeholder="Maharashtra" className="h-11" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="zipCode" className="font-bold">Pincode</Label>
                          <Input name="zipCode" value={formData.zipCode} onChange={updateFormData} placeholder="400001" className="h-11" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="serviceRadius" className="font-bold">Service Radius (KM)</Label>
                          <Input type="number" name="serviceRadius" value={formData.serviceRadius} onChange={updateFormData} placeholder="20" className="h-11" />
                        </div>
                      </div>
                    </>
                  )}

                  {currentStep === 2 && (
                    <>
                      <div className="border-b border-gray-100 pb-4 mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Business Details</h2>
                        <p className="text-sm text-gray-500">Official information for verification.</p>
                      </div>
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="contactPerson" className="font-bold">Primary Contact Person</Label>
                          <Input name="contactPerson" value={formData.contactPerson} onChange={updateFormData} placeholder="Full Name" className="h-11" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="gstNumber" className="font-bold">GST Number (Optional)</Label>
                          <Input name="gstNumber" value={formData.gstNumber} onChange={updateFormData} placeholder="22AAAAA0000A1Z5" className="h-11" />
                        </div>
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-md">
                          <p className="text-xs text-amber-800">Note: GST is required for corporate bookings and tax benefits.</p>
                        </div>
                      </div>
                    </>
                  )}

                  {currentStep === 3 && (
                    <>
                      <div className="border-b border-gray-100 pb-4 mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Payout Information</h2>
                        <p className="text-sm text-gray-500">Where should we send your earnings?</p>
                      </div>
                      <div className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="bankName" className="font-bold">Bank Name</Label>
                          <Input name="bankName" value={formData.bankName} onChange={updateFormData} placeholder="HDFC Bank" className="h-11" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="accountNumber" className="font-bold">Account Number</Label>
                          <Input name="accountNumber" value={formData.accountNumber} onChange={updateFormData} placeholder="0000 0000 0000 0000" className="h-11" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="ifscCode" className="font-bold">IFSC Code</Label>
                          <Input name="ifscCode" value={formData.ifscCode} onChange={updateFormData} placeholder="HDFC0001234" className="h-11" />
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0 || loading}
                className="h-10 px-6 font-bold border-gray-300"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={loading}
                className="h-10 px-8 bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md transition-all active:scale-95"
              >
                {currentStep === STEPS.length - 1 ? (loading ? "Saving..." : "Complete Setup") : "Save \u0026 Continue"}
                {currentStep !== STEPS.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-8">
            Need help? Contact Mana Events Seller Support at support@manaevents.in
          </p>
        </div>
      </main>
    </div>
  );
}
