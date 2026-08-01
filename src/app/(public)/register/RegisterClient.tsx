"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/validations/auth";
import * as z from "zod";
import { authService } from "@/services/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, CheckCircle2, User, Building2, MapPin, ShieldCheck } from "lucide-react";
import axios from "axios";

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams?.get("role") === "VENDOR" ? "VENDOR" : "CUSTOMER";
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: defaultRole as "CUSTOMER" | "VENDOR",
      experienceYears: 0,
    },
  });

  const selectedRole = watch("role");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/categories");
        setCategories(response.data);
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };
    fetchCategories();
  }, []);

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    console.log("Outgoing registration payload:", data);
    try {
      const response = await authService.register(data);
      console.log("Registration successful response:", response);
      toast({
        title: "Registration Successful",
        description: selectedRole === "VENDOR"
          ? "Your vendor account has been created and is under review."
          : "Your account has been created. Please login.",
      });
      router.push("/login");
    } catch (error: any) {
      console.error("Registration failed response:", error.response?.data);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.response?.data?.message || "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await trigger(fieldsToValidate as any);
    if (isValid) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  const getFieldsForStep = (step: number) => {
    switch (step) {
      case 1: return ["fullName", "email", "mobileNumber", "password", "confirmPassword"];
      case 2: return ["businessName", "categoryId", "experienceYears", "description"];
      case 3: return ["state", "city", "address", "pincode"];
      case 4: return ["gstNumber", "panNumber", "aadhaarNumber"];
      default: return [];
    }
  };

  const renderCustomerForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="fullName" className="text-sm font-bold text-slate-700">Full Name *</Label>
        <Input id="fullName" placeholder="Enter your full name" {...register("fullName")} className={`rounded-md h-11 ${errors.fullName ? "border-red-500" : ""}`} />
        {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-bold text-slate-700">Email Address *</Label>
          <Input id="email" type="email" placeholder="example@mail.com" {...register("email")} className={`rounded-md h-11 ${errors.email ? "border-red-500" : ""}`} />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mobileNumber" className="text-sm font-bold text-slate-700">Mobile Number *</Label>
          <Input id="mobileNumber" placeholder="10-digit number" {...register("mobileNumber")} className={`rounded-md h-11 ${errors.mobileNumber ? "border-red-500" : ""}`} />
          {errors.mobileNumber && <p className="text-red-500 text-xs mt-1">{errors.mobileNumber.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-bold text-slate-700">Password *</Label>
          <Input id="password" type="password" placeholder="Min 8 characters" {...register("password")} className={`rounded-md h-11 ${errors.password ? "border-red-500" : ""}`} />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-sm font-bold text-slate-700">Confirm Password *</Label>
          <Input id="confirmPassword" type="password" placeholder="Repeat password" {...register("confirmPassword")} className={`rounded-md h-11 ${errors.confirmPassword ? "border-red-500" : ""}`} />
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="referralCode" className="text-sm font-bold text-slate-700">Referral Code (Optional)</Label>
        <Input id="referralCode" placeholder="Enter referral code if any" {...register("referralCode")} className="rounded-md h-11" />
      </div>

      <Button type="submit" className="w-full h-11 rounded-md font-bold text-base bg-primary hover:bg-primary/90 text-white shadow-md transition-all" disabled={isLoading}>
        {isLoading ? "Creating Account..." : "Create Account"}
      </Button>

      <div className="text-center pt-4 border-t border-slate-100">
        <p className="text-slate-600 font-medium text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-bold hover:underline">Login</Link>
        </p>
      </div>
    </form>
  );

  const renderVendorForm = () => {
    const steps = [
      { id: 1, title: "Personal", icon: User },
      { id: 2, title: "Business", icon: Building2 },
      { id: 3, title: "Location", icon: MapPin },
      { id: 4, title: "Verify", icon: ShieldCheck },
    ];

    return (
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex justify-between items-center mb-8 px-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex flex-col items-center relative flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-all ${currentStep >= s.id ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}>
                {currentStep > s.id ? <CheckCircle2 className="w-6 h-6" /> : <s.icon className="w-5 h-5" />}
              </div>
              <span className={`text-[10px] font-bold mt-2 uppercase tracking-wider ${currentStep >= s.id ? 'text-primary' : 'text-slate-400'}`}>{s.title}</span>
              {i < steps.length - 1 && (
                <div className={`absolute h-[2px] w-full top-5 left-1/2 -z-0 transition-all ${currentStep > s.id ? 'bg-primary' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {currentStep === 1 && (
              <>
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">Step 1: Personal Information</h3>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-bold">Owner Full Name *</Label>
                    <Input {...register("fullName")} placeholder="John Doe" className={errors.fullName ? "border-red-500" : ""} />
                    {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-bold">Email Address *</Label>
                      <Input type="email" {...register("email")} placeholder="owner@business.com" className={errors.email ? "border-red-500" : ""} />
                      {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-bold">Mobile Number *</Label>
                      <Input {...register("mobileNumber")} placeholder="10-digit number" className={errors.mobileNumber ? "border-red-500" : ""} />
                      {errors.mobileNumber && <p className="text-red-500 text-xs">{errors.mobileNumber.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-bold">Password *</Label>
                      <Input type="password" {...register("password")} placeholder="Min 8 characters" className={errors.password ? "border-red-500" : ""} />
                      {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-bold">Confirm Password *</Label>
                      <Input type="password" {...register("confirmPassword")} placeholder="Repeat password" className={errors.confirmPassword ? "border-red-500" : ""} />
                      {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>}
                    </div>
                  </div>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">Step 2: Business Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-bold">Business Name *</Label>
                      <Input {...register("businessName")} placeholder="Acme Events" className={errors.businessName ? "border-red-500" : ""} />
                      {errors.businessName && <p className="text-red-500 text-xs">{errors.businessName.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-bold">Business Category *</Label>
                      <Select onValueChange={(val) => setValue("categoryId", val)} defaultValue={watch("categoryId")}>
                        <SelectTrigger className={errors.categoryId ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.categoryId && <p className="text-red-500 text-xs">{errors.categoryId.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-bold">Years of Experience *</Label>
                    <Input type="number" {...register("experienceYears")} className={errors.experienceYears ? "border-red-500" : ""} />
                    {errors.experienceYears && <p className="text-red-500 text-xs">{errors.experienceYears.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-bold">Business Description</Label>
                    <Textarea {...register("description")} placeholder="Describe your services..." className="min-h-[100px]" />
                  </div>
                </div>
              </>
            )}

            {currentStep === 3 && (
              <>
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">Step 3: Business Location</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-bold">State *</Label>
                      <Input {...register("state")} placeholder="e.g. Maharashtra" className={errors.state ? "border-red-500" : ""} />
                      {errors.state && <p className="text-red-500 text-xs">{errors.state.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-bold">City *</Label>
                      <Input {...register("city")} placeholder="e.g. Mumbai" className={errors.city ? "border-red-500" : ""} />
                      {errors.city && <p className="text-red-500 text-xs">{errors.city.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-bold">Complete Address *</Label>
                    <Textarea {...register("address")} placeholder="Office/Studio Address" className={errors.address ? "border-red-500" : ""} />
                    {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-bold">Pincode *</Label>
                    <Input {...register("pincode")} placeholder="6-digit pincode" className={errors.pincode ? "border-red-500" : ""} />
                    {errors.pincode && <p className="text-red-500 text-xs">{errors.pincode.message}</p>}
                  </div>
                </div>
              </>
            )}

            {currentStep === 4 && (
              <>
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">Step 4: Verification</h3>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-bold">GST Number (Optional)</Label>
                    <Input {...register("gstNumber")} placeholder="Enter GSTIN" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-bold">PAN Number (Optional)</Label>
                    <Input {...register("panNumber")} placeholder="Enter PAN" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-bold">Aadhaar Number (Optional)</Label>
                    <Input {...register("aadhaarNumber")} placeholder="Enter 12-digit Aadhaar" />
                  </div>
                  <div className="flex items-start space-x-2 pt-4">
                    <Checkbox id="terms" required />
                    <Label htmlFor="terms" className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I agree to the <Link href="/terms" className="text-primary hover:underline">Vendor Terms & Conditions</Link>
                    </Label>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between gap-4 pt-6 mt-8 border-t border-slate-100">
          {currentStep > 1 && (
            <Button type="button" variant="outline" onClick={prevStep} className="flex-1 h-11 font-bold">
              <ChevronLeft className="w-4 h-4 mr-2" /> Previous
            </Button>
          )}
          {currentStep < 4 ? (
            <Button type="button" onClick={nextStep} className={`h-11 font-bold ${currentStep === 1 ? 'w-full' : 'flex-1'}`}>
              Next Step <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit(onSubmit)} className="flex-1 h-11 font-bold bg-primary hover:bg-primary/90 text-white" disabled={isLoading}>
              {isLoading ? "Creating Vendor Account..." : "Create Vendor Account"}
            </Button>
          )}
        </div>

        {currentStep === 4 && (
          <p className="text-xs text-center text-slate-500 italic mt-4">
            Your vendor account will be reviewed by our team before activation.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="flex-1 flex flex-col items-center justify-center p-4 py-12">
        <div className="mb-8 text-center max-w-xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
            {selectedRole === 'VENDOR' ? 'Become a Mana Events Vendor' : 'Create Customer Account'}
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            {selectedRole === 'VENDOR'
              ? 'Register your business and start receiving bookings from thousands of customers.'
              : 'Create your Mana Events account to discover and book the best event services.'}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full ${selectedRole === 'VENDOR' ? 'max-w-[650px]' : 'max-w-[450px]'} bg-white border border-slate-200 p-8 rounded-xl shadow-xl relative z-10 transition-all duration-300`}
        >
          <div className="mb-8">
            <Label className="text-sm font-bold text-slate-700 block mb-3 text-center uppercase tracking-widest">Register as</Label>
            <RadioGroup
              defaultValue={selectedRole}
              onValueChange={(value) => {
                setValue("role", value as "CUSTOMER" | "VENDOR");
                setCurrentStep(1);
              }}
              className="flex justify-center gap-4"
            >
              <div
                className={`flex items-center justify-center px-8 py-3 rounded-full border-2 transition-all cursor-pointer ${selectedRole === 'CUSTOMER' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                onClick={() => { setValue("role", "CUSTOMER"); setCurrentStep(1); }}
              >
                <RadioGroupItem value="CUSTOMER" id="customer" className="sr-only" />
                <Label htmlFor="customer" className="font-bold text-xs cursor-pointer">CUSTOMER</Label>
              </div>
              <div
                className={`flex items-center justify-center px-8 py-3 rounded-full border-2 transition-all cursor-pointer ${selectedRole === 'VENDOR' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                onClick={() => { setValue("role", "VENDOR"); setCurrentStep(1); }}
              >
                <RadioGroupItem value="VENDOR" id="vendor" className="sr-only" />
                <Label htmlFor="vendor" className="font-bold text-xs cursor-pointer">VENDOR</Label>
              </div>
            </RadioGroup>
          </div>

          {selectedRole === 'CUSTOMER' ? renderCustomerForm() : renderVendorForm()}

        </motion.div>

        <div className="mt-12 text-center space-y-4">
          <p className="text-slate-500 text-sm font-medium">Join thousands of others on Mana Events</p>
          <div className="flex items-center justify-center gap-6 text-xs font-bold text-primary/70">
            <Link href="#" className="hover:text-primary transition-colors">Vendor Guide</Link>
            <Link href="#" className="hover:text-primary transition-colors">Safety Center</Link>
            <Link href="#" className="hover:text-primary transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
