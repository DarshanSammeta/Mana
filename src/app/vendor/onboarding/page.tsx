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
  Upload,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { vendorService } from "@/services/client";
import { marketplaceService } from "@/services/client";
import SuccessState from "@/components/common/SuccessState";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

const STEPS = [
  { id: "basic", title: "Business Profile", icon: Store },
  { id: "location", title: "Contact & Address", icon: MapPin },
  { id: "kyc", title: "KYC & Verification", icon: FileText },
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
    businessType: "Individual",
    description: "",
    aboutBusiness: "",
    categoryId: "",
    subcategoryIds: [] as string[],
    contactPerson: user?.fullName || "",
    alternateMobileNumber: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    serviceRadius: "50",
    panNumber: "",
    aadhaarNumber: "",
    gstNumber: "",
    panUrl: "",
    aadhaarUrl: "",
    gstUrl: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    logo: "",
    coverImage: "",
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
      await vendorService.updateProfile({
        ...formData,
        serviceRadius: parseFloat(formData.serviceRadius),
        bankDetails: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          upiId: formData.upiId
        }
      });

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'coverImage' | 'panUrl' | 'aadhaarUrl' | 'gstUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const { secure_url } = await vendorService.uploadMedia(file);
      setFormData(prev => ({ ...prev, [field]: secure_url }));

      // If it's a KYC document, also register it in vendor documents
      if (field === 'panUrl' || field === 'aadhaarUrl' || field === 'gstUrl') {
        const typeMap = {
          panUrl: 'PAN',
          aadhaarUrl: 'AADHAAR',
          gstUrl: 'GST'
        };
        await vendorService.uploadDocument({
          type: typeMap[field],
          url: secure_url
        });
      }

      toast({ title: "Success", description: `${field.replace('Url', '').toUpperCase()} uploaded successfully` });
    } catch {
      toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload file" });
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <SuccessState
          title="Profile Completed!"
          message="Your business profile has been successfully set up. Please add your services and portfolio next."
          onContinue={() => router.push("/vendor/services")}
          continueText="Setup Services"
          showHome={false}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-slate-900 text-white py-4 px-6 flex items-center justify-between shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight">mana<span className="text-primary">Events</span></span>
          <span className="text-[10px] bg-primary/20 border border-primary/30 px-2 py-0.5 rounded text-primary font-bold uppercase tracking-wider">Seller Central</span>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-300">
          Step {currentStep + 1} of {STEPS.length}: <span className="text-white">{STEPS[currentStep].title}</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-4xl">
          {/* Progress Indicator */}
          <div className="flex justify-between mb-12 relative px-4">
            <div className="absolute top-5 left-8 right-8 h-0.5 bg-slate-200 z-0" />
            {STEPS.map((step, idx) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center w-1/4">
                <div className={`h-11 w-11 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  idx <= currentStep ? "bg-primary border-primary text-white shadow-md scale-110" : "bg-white border-slate-300 text-slate-400"
                }`}>
                  {idx < currentStep ? <CheckCircle2 className="h-6 w-6" /> : <step.icon className="h-5 w-5" />}
                </div>
                <span className={`text-[10px] font-extrabold uppercase mt-3 tracking-widest text-center px-1 ${idx <= currentStep ? "text-slate-900" : "text-slate-400"}`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    {currentStep === 0 && (
                      <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                          <h2 className="text-2xl font-bold text-slate-900">Business Profile</h2>
                          <p className="text-sm text-slate-500 font-medium">Basic information about your enterprise.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="businessName" className="text-sm font-bold text-slate-700">Business Name</Label>
                            <Input name="businessName" value={formData.businessName} onChange={updateFormData} placeholder="e.g. Royal Wedding Decorators" className="h-11" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="businessType" className="text-sm font-bold text-slate-700">Business Type</Label>
                            <select name="businessType" value={formData.businessType} onChange={(e) => updateFormData(e as any)} className="w-full h-11 border border-slate-300 rounded-md px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white font-medium">
                              <option>Individual</option>
                              <option>Private Limited</option>
                              <option>Partnership</option>
                              <option>Proprietorship</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700">Business Logo</Label>
                                <div className="flex items-center gap-4">
                                    <div className="h-20 w-20 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 relative">
                                        {formData.logo ? (
                                            <Image src={formData.logo} alt="Logo" fill className="object-cover" />
                                        ) : (
                                            <Upload className="h-6 w-6 text-slate-400" />
                                        )}
                                    </div>
                                    <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} className="hidden" id="logo-upload" />
                                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('logo-upload')?.click()}>
                                        Upload Logo
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700">Cover Image</Label>
                                <div className="flex items-center gap-4">
                                    <div className="h-20 w-32 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 relative">
                                        {formData.coverImage ? (
                                            <Image src={formData.coverImage} alt="Cover" fill className="object-cover" />
                                        ) : (
                                            <Upload className="h-6 w-6 text-slate-400" />
                                        )}
                                    </div>
                                    <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'coverImage')} className="hidden" id="cover-upload" />
                                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('cover-upload')?.click()}>
                                        Upload Cover
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description" className="text-sm font-bold text-slate-700">About Business</Label>
                          <Textarea name="description" value={formData.description} onChange={updateFormData} placeholder="Tell customers what makes your service unique..." className="min-h-[120px]" />
                        </div>

                        <div className="space-y-4">
                          <Label className="text-sm font-bold text-slate-700">Primary Business Category</Label>
                          <select
                            name="categoryId"
                            value={formData.categoryId}
                            onChange={(e) => {
                              updateFormData(e as any);
                              setFormData(prev => ({ ...prev, subcategoryIds: [] }));
                            }}
                            className="w-full h-11 border border-slate-300 rounded-md px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white font-medium"
                          >
                            <option value="">Select Category</option>
                            {categories.map((cat: any) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>

                          {formData.categoryId && (
                            <div className="space-y-3 pt-2">
                              <Label className="text-sm font-bold text-slate-700">Sub-Categories / Services</Label>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {categories.find(c => c.id === formData.categoryId)?.subcategory?.map((sub: any) => (
                                  <div
                                    key={sub.id}
                                    onClick={() => handleSubcategoryToggle(sub.id)}
                                    className={`p-3 border rounded-lg cursor-pointer transition-all text-xs flex items-center gap-2 ${
                                      formData.subcategoryIds.includes(sub.id)
                                        ? "border-primary bg-primary/5 text-primary font-bold shadow-sm"
                                        : "border-slate-200 hover:border-slate-300 bg-white"
                                    }`}
                                  >
                                    <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                                      formData.subcategoryIds.includes(sub.id) ? "bg-primary border-primary" : "border-slate-300 bg-white"
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
                      </div>
                    )}

                    {currentStep === 1 && (
                      <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                          <h2 className="text-2xl font-bold text-slate-900">Contact & Address</h2>
                          <p className="text-sm text-slate-500 font-medium">How can we and customers reach you?</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="contactPerson" className="text-sm font-bold text-slate-700">Contact Person Name</Label>
                            <Input name="contactPerson" value={formData.contactPerson} onChange={updateFormData} placeholder="Full Name" className="h-11" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="alternateMobileNumber" className="text-sm font-bold text-slate-700">Alternate Mobile (Optional)</Label>
                            <Input name="alternateMobileNumber" value={formData.alternateMobileNumber} onChange={updateFormData} placeholder="10-digit number" className="h-11" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address" className="text-sm font-bold text-slate-700">Business Address</Label>
                          <Input name="address" value={formData.address} onChange={updateFormData} placeholder="Flat/Office No, Building, Street" className="h-11" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="col-span-1 space-y-2">
                            <Label htmlFor="city" className="text-sm font-bold text-slate-700">City</Label>
                            <Input name="city" value={formData.city} onChange={updateFormData} placeholder="City" className="h-11" />
                          </div>
                          <div className="col-span-1 space-y-2">
                            <Label htmlFor="state" className="text-sm font-bold text-slate-700">State</Label>
                            <Input name="state" value={formData.state} onChange={updateFormData} placeholder="State" className="h-11" />
                          </div>
                          <div className="col-span-1 space-y-2">
                            <Label htmlFor="zipCode" className="text-sm font-bold text-slate-700">Pincode</Label>
                            <Input name="zipCode" value={formData.zipCode} onChange={updateFormData} placeholder="6-digit" className="h-11" />
                          </div>
                          <div className="col-span-1 space-y-2">
                            <Label htmlFor="serviceRadius" className="text-sm font-bold text-slate-700">Radius (KM)</Label>
                            <Input type="number" name="serviceRadius" value={formData.serviceRadius} onChange={updateFormData} placeholder="50" className="h-11" />
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                          <h2 className="text-2xl font-bold text-slate-900">KYC & Verification</h2>
                          <p className="text-sm text-slate-500 font-medium">Verify your business for trust and higher rankings.</p>
                        </div>
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="panNumber" className="text-sm font-bold text-slate-700">PAN Card Number</Label>
                                <Input name="panNumber" value={formData.panNumber} onChange={updateFormData} placeholder="ABCDE1234F" className="h-11 uppercase" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700">PAN Card Document</Label>
                                <div className="flex items-center gap-4">
                                  <div className="h-20 w-32 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 relative">
                                    {formData.panUrl ? (
                                      formData.panUrl.endsWith('.pdf') ? (
                                        <FileText className="h-8 w-8 text-blue-500" />
                                      ) : (
                                        <Image src={formData.panUrl} alt="PAN" fill className="object-cover" />
                                      )
                                    ) : (
                                      <Upload className="h-6 w-6 text-slate-400" />
                                    )}
                                  </div>
                                  <Input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'panUrl')} className="hidden" id="pan-upload" />
                                  <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('pan-upload')?.click()}>
                                    {formData.panUrl ? "Change File" : "Upload PAN"}
                                  </Button>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="aadhaarNumber" className="text-sm font-bold text-slate-700">Aadhaar Number</Label>
                                <Input name="aadhaarNumber" value={formData.aadhaarNumber} onChange={updateFormData} placeholder="12-digit number" className="h-11" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700">Aadhaar Card Document</Label>
                                <div className="flex items-center gap-4">
                                  <div className="h-20 w-32 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 relative">
                                    {formData.aadhaarUrl ? (
                                      formData.aadhaarUrl.endsWith('.pdf') ? (
                                        <FileText className="h-8 w-8 text-blue-500" />
                                      ) : (
                                        <Image src={formData.aadhaarUrl} alt="Aadhaar" fill className="object-cover" />
                                      )
                                    ) : (
                                      <Upload className="h-6 w-6 text-slate-400" />
                                    )}
                                  </div>
                                  <Input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'aadhaarUrl')} className="hidden" id="aadhaar-upload" />
                                  <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('aadhaar-upload')?.click()}>
                                    {formData.aadhaarUrl ? "Change File" : "Upload Aadhaar"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="gstNumber" className="text-sm font-bold text-slate-700">GST Number (Optional)</Label>
                              <Input name="gstNumber" value={formData.gstNumber} onChange={updateFormData} placeholder="22AAAAA0000A1Z5" className="h-11 uppercase" />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-bold text-slate-700">GST Registration Document</Label>
                              <div className="flex items-center gap-4">
                                <div className="h-20 w-32 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 relative">
                                  {formData.gstUrl ? (
                                    formData.gstUrl.endsWith('.pdf') ? (
                                      <FileText className="h-8 w-8 text-blue-500" />
                                    ) : (
                                      <Image src={formData.gstUrl} alt="GST" fill className="object-cover" />
                                    )
                                  ) : (
                                    <Upload className="h-6 w-6 text-slate-400" />
                                  )}
                                </div>
                                <Input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'gstUrl')} className="hidden" id="gst-upload" />
                                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('gst-upload')?.click()}>
                                  {formData.gstUrl ? "Change File" : "Upload GST"}
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                            <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 mt-0.5">!</div>
                            <p className="text-[12px] text-slate-600 leading-relaxed">
                                Uploading clear documents increases your chances of getting the <span className="font-bold text-slate-900">Verified Vendor Badge</span>. We protect your data as per our Privacy Policy.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStep === STEPS.length - 1 && (
                      <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                          <h2 className="text-2xl font-bold text-slate-900">Payout Information</h2>
                          <p className="text-sm text-slate-500 font-medium">Configure where you want to receive payments.</p>
                        </div>
                        <div className="space-y-5">
                          <div className="space-y-2">
                            <Label htmlFor="bankName" className="text-sm font-bold text-slate-700">Bank Name</Label>
                            <Input name="bankName" value={formData.bankName} onChange={updateFormData} placeholder="e.g. ICICI Bank" className="h-11" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="accountNumber" className="text-sm font-bold text-slate-700">Account Number</Label>
                              <Input name="accountNumber" value={formData.accountNumber} onChange={updateFormData} placeholder="000000000000" className="h-11" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="ifscCode" className="text-sm font-bold text-slate-700">IFSC Code</Label>
                              <Input name="ifscCode" value={formData.ifscCode} onChange={updateFormData} placeholder="ICIC0001234" className="h-11 uppercase" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="upiId" className="text-sm font-bold text-slate-700">UPI ID (Optional)</Label>
                            <Input name="upiId" value={formData.upiId} onChange={updateFormData} placeholder="yourname@upi" className="h-11" />
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Action Bar */}
              <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0 || loading}
                  className="h-11 px-8 font-bold border-slate-300 text-slate-700 hover:bg-slate-100 transition-all"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={loading}
                  className="h-11 px-10 bg-primary hover:bg-primary/90 text-white font-bold shadow-sm transition-all active:scale-95"
                >
                  {currentStep === STEPS.length - 1 ? (loading ? "Finishing..." : "Complete Setup") : "Save \u0026 Continue"}
                  {currentStep !== STEPS.length - 1 && <ChevronRight className="h-4 w-4 ml-2" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-12 text-center">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
              Mana Events Platform Security & Verification
            </p>
            <div className="flex items-center justify-center gap-6 mt-4 opacity-50 grayscale hover:opacity-100 transition-all duration-300">
                <div className="text-xs font-bold text-slate-500 flex items-center gap-1 border border-slate-300 px-2 py-1 rounded">SSL SECURE</div>
                <div className="text-xs font-bold text-slate-500 flex items-center gap-1 border border-slate-300 px-2 py-1 rounded">KYC VERIFIED</div>
                <div className="text-xs font-bold text-slate-500 flex items-center gap-1 border border-slate-300 px-2 py-1 rounded">PCI COMPLIANT</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
