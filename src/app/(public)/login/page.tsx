"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { useCommerceStore } from "@/store/commerceStore";
import Navbar from "@/components/common/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const setUser = useAuthStore((state) => state.setUser);

  const redirectMsg = searchParams?.get("message");

  // ... (inside useEffect or similar, but here let's just show it)

  // Actually let's use useSearchParams from next/navigation

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const handleContinue = async (e: React.MouseEvent) => {
    e.preventDefault();
    const isValid = await trigger("email");
    if (isValid) {
      setStep(2);
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/auth/login", data);
      const { user, accessToken } = response.data;

      setUser(user, accessToken);

      const { cart, wishlist, clearCart, setWishlist } = useCommerceStore.getState();

      // Fire and forget commerce merge to not block navigation
      if (cart.length > 0 || wishlist.length > 0) {
        axios.post("/api/commerce/merge", {
          cartItems: cart.map(item => ({
            targetId: item.targetId,
            type: item.type,
            quantity: item.quantity
          })),
          wishlistItems: wishlist
        }, {
          headers: { Authorization: `Bearer ${accessToken}` }
        }).then(() => {
          clearCart();
          setWishlist([]);
        }).catch(mergeError => {
          console.error("Failed to merge commerce state:", mergeError);
        });
      }

      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.fullName}!`,
      });

      if (user.role === "VENDOR") {
        router.push("/vendor/dashboard");
      } else {
        router.push("/");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.response?.data?.message || "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-4 py-12">
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-1">
              mana<span className="text-primary">Events</span> Seller Central
            </h1>
            <p className="text-slate-500 text-sm max-w-sm mx-auto font-medium">
              Manage services, bookings, customer inquiries, reviews, and earnings from one dashboard.
            </p>
        </div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[400px] bg-white border border-slate-200 p-8 rounded-xl shadow-sm relative z-10"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">Sign In</h2>
            {redirectMsg && (
              <p className="mt-4 text-sm font-medium text-destructive bg-destructive/5 py-2 px-4 border border-destructive/10 rounded-lg">
                {redirectMsg}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-bold text-slate-700">Email or Mobile Number</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      {...register("email")}
                      className={`rounded-md h-10 px-3 border-slate-300 focus:border-primary focus:ring-primary/10 transition-all ${errors.email ? "border-red-500 focus-visible:ring-red-500/20" : ""}`}
                    />
                    {errors.email && <p className="text-red-500 text-xs font-medium mt-1">{errors.email.message}</p>}
                  </div>

                  <Button
                    onClick={handleContinue}
                    type="button"
                    className="w-full h-10 rounded-md font-bold text-sm bg-primary hover:bg-primary/90 text-white shadow-sm transition-all"
                    isLoading={isLoading}
                  >
                    Continue
                  </Button>

                  <p className="text-[12px] text-slate-500 leading-normal">
                    By continuing, you agree to Mana Events <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-4 p-2 bg-slate-50 rounded-md border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-900 truncate max-w-[200px]">{getValues("email")}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-xs text-blue-600 font-bold hover:underline"
                    >
                        Change
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="text-sm font-bold text-slate-700">Password</Label>
                      <Link href="/forgot-password" title="Help with password" className="text-xs font-semibold text-blue-600 hover:underline">
                        Forgot Password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      autoFocus
                      {...register("password")}
                      className={`rounded-md h-10 px-3 border-slate-300 focus:border-primary focus:ring-primary/10 transition-all ${errors.password ? "border-red-500 focus-visible:ring-red-500/20" : ""}`}
                    />
                    {errors.password && <p className="text-red-500 text-xs font-medium mt-1">{errors.password.message}</p>}
                  </div>

                  <Button type="submit" className="w-full h-10 rounded-md font-bold text-sm bg-primary hover:bg-primary/90 text-white shadow-sm transition-all" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {step === 1 && (
            <div className="mt-8 pt-6 border-t border-slate-100">
               <div className="text-center mb-4">
                  <span className="text-xs text-slate-500 font-medium">New to Mana Events?</span>
                </div>
              <Button variant="outline" className="w-full h-10 rounded-md font-bold text-sm border-slate-300 hover:bg-slate-50 text-slate-700" asChild>
                <Link href="/register">Become a Vendor</Link>
              </Button>
            </div>
          )}
        </motion.div>

        <div className="mt-8 text-center space-y-2">
            <p className="text-slate-600 text-sm font-medium">Grow your business with Mana Events</p>
            <div className="flex items-center justify-center gap-4 text-xs font-semibold text-blue-600">
                <Link href="#" className="hover:underline">Sell on Mana Events</Link>
                <Link href="#" className="hover:underline">Pricing</Link>
                <Link href="#" className="hover:underline">Success Stories</Link>
            </div>
        </div>
      </div>
    </div>
  );
}
