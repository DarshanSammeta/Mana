"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authService } from "@/services/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  mobileNumber: z.string().length(10, "Mobile number must be exactly 10 digits"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  role: z.enum(["CUSTOMER", "VENDOR"]),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterClient() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams?.get("role") === "VENDOR" ? "VENDOR" : "CUSTOMER";
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: defaultRole as "CUSTOMER" | "VENDOR",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await authService.register(data);
      toast({
        title: "Registration Successful",
        description: "Your account has been created. Please login.",
      });
      router.push("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.response?.data?.message || "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <div className="flex-1 flex flex-col items-center justify-center p-4 py-12">
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">
              mana<span className="text-primary">Events</span> Seller Central
            </h1>
            <p className="text-slate-500 text-sm max-w-sm mx-auto font-medium">
              Create your vendor account and start growing your business today.
            </p>
        </div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[450px] bg-white border border-slate-200 p-8 rounded-xl shadow-sm relative z-10"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">Create Account</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">I want to register as</Label>
              <RadioGroup
                defaultValue={defaultRole}
                onValueChange={(value) => setValue("role", value as "CUSTOMER" | "VENDOR")}
                className="grid grid-cols-2 gap-3"
              >
                <div
                  className={`flex items-center justify-center p-3 rounded-md border transition-all cursor-pointer ${selectedRole === 'CUSTOMER' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                  onClick={() => setValue("role", "CUSTOMER")}
                >
                    <RadioGroupItem value="CUSTOMER" id="customer" className="sr-only" />
                    <Label htmlFor="customer" className="font-bold text-xs cursor-pointer">CUSTOMER</Label>
                </div>
                <div
                  className={`flex items-center justify-center p-3 rounded-md border transition-all cursor-pointer ${selectedRole === 'VENDOR' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                  onClick={() => setValue("role", "VENDOR")}
                >
                    <RadioGroupItem value="VENDOR" id="vendor" className="sr-only" />
                    <Label htmlFor="vendor" className="font-bold text-xs cursor-pointer">VENDOR</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-bold text-slate-700">Full Name</Label>
              <Input
                id="fullName"
                placeholder="First and last name"
                {...register("fullName")}
                className={`rounded-md h-10 px-3 border-slate-300 focus:border-primary focus:ring-primary/10 transition-all ${errors.fullName ? "border-red-500" : ""}`}
              />
              {errors.fullName && <p className="text-red-500 text-xs font-medium mt-1">{errors.fullName.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-bold text-slate-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@mail.com"
                    {...register("email")}
                    className={`rounded-md h-10 px-3 border-slate-300 focus:border-primary focus:ring-primary/10 transition-all ${errors.email ? "border-red-500" : ""}`}
                  />
                  {errors.email && <p className="text-red-500 text-xs font-medium mt-1">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mobileNumber" className="text-sm font-bold text-slate-700">Mobile Number</Label>
                  <Input
                    id="mobileNumber"
                    placeholder="10-digit number"
                    {...register("mobileNumber")}
                    className={`rounded-md h-10 px-3 border-slate-300 focus:border-primary focus:ring-primary/10 transition-all ${errors.mobileNumber ? "border-red-500" : ""}`}
                  />
                  {errors.mobileNumber && <p className="text-red-500 text-xs font-medium mt-1">{errors.mobileNumber.message}</p>}
                </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-bold text-slate-700">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                {...register("password")}
                className={`rounded-md h-10 px-3 border-slate-300 focus:border-primary focus:ring-primary/10 transition-all ${errors.password ? "border-red-500" : ""}`}
              />
              {errors.password && <p className="text-red-500 text-xs font-medium mt-1">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full h-10 rounded-md font-bold text-sm bg-primary hover:bg-primary/90 text-white shadow-sm transition-all" disabled={isLoading}>
              Create your Seller account
            </Button>

            <p className="text-[12px] text-slate-500 leading-normal">
                By creating an account, you agree to Mana Events <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
            </p>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-600 font-medium text-sm">
              Already have a seller account?{" "}
              <Link href="/login" className="text-blue-600 font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>

        <div className="mt-8 text-center space-y-2">
            <p className="text-slate-600 text-sm font-medium">Join thousands of vendors on Mana Events</p>
            <div className="flex items-center justify-center gap-4 text-xs font-semibold text-blue-600">
                <Link href="#" className="hover:underline">Vendor Guide</Link>
                <Link href="#" className="hover:underline">Commission Rates</Link>
                <Link href="#" className="hover:underline">Support</Link>
            </div>
        </div>
      </div>
    </div>
  );
}
