"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { useCommerceStore } from "@/store/commerceStore";
import { authService } from "@/services/client";
import { motion, AnimatePresence } from "framer-motion";

import { loginSchema, LoginFormInput } from "@/validations";

export default function LoginClient() {
  const [step, setStep] = useState(1); // 1: Email, 2: Password, 3: OTP
  const [role, setRole] = useState<"CUSTOMER" | "VENDOR">("CUSTOMER");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const setUser = useAuthStore((state) => state.setUser);

  const redirectMsg = searchParams?.get("message");

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<LoginFormInput>({
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

  const finalizeLogin = (user: any, accessToken: string) => {
    setUser(user, accessToken);
    const { cart, wishlist, clearCart, setWishlist } = useCommerceStore.getState();

    if (cart.length > 0 || wishlist.length > 0) {
      authService.mergeCommerce({
        cartItems: cart.map(item => ({
          targetId: item.targetId,
          type: item.type,
          quantity: item.quantity
        })),
        wishlistItems: wishlist
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
  };

  const onSubmit = async (data: LoginFormInput) => {
    setIsLoading(true);
    try {
      const result = await authService.login({ ...data, role });

      if (result.requiresOTP) {
        setUserId(result.userId);
        setStep(3);

        toast({
          title: "OTP Sent",
          description: "Please check your email for the verification code.",
        });
      } else {
        const { user, accessToken } = result;
        finalizeLogin(user, accessToken);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: err.response?.data?.message || "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    console.log("[AUTH] Verifying OTP for userId:", userId);
    setIsLoading(true);
    try {
      const result = await authService.verifyOtp({
        userId: userId!,
        otp
      });
      const { user, accessToken } = result;
      finalizeLogin(user, accessToken);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: err.response?.data?.message || "Invalid OTP",
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
              mana<span className="text-blue-600">Events</span>
            </h1>
            <p className="text-slate-500 text-sm max-w-sm mx-auto font-medium">
              Join thousands of vendors and customers in the premium event marketplace.
            </p>
        </div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[400px] bg-white border border-slate-200 p-8 rounded-xl shadow-sm relative z-10"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">
              {step === 3 ? "Verify OTP" : role === "VENDOR" ? "Vendor Login" : "Sign In"}
            </h2>
            {step === 1 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-slate-500">Continue As</p>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setRole("CUSTOMER")}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition-all ${
                      role === "CUSTOMER"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    👤 Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("VENDOR")}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition-all ${
                      role === "VENDOR"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    🏪 Vendor
                  </button>
                </div>
              </div>
            )}
            {redirectMsg && step !== 3 && (
              <p className="mt-4 text-sm font-medium text-destructive bg-destructive/5 py-2 px-4 border border-destructive/10 rounded-lg">
                {redirectMsg}
              </p>
            )}
          </div>

          {step === 3 ? (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="otp" className="text-sm font-bold text-slate-700">6-Digit Code</Label>
                <Input
                  id="otp"
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="text-center text-2xl tracking-[0.5em] font-bold h-12 border-slate-300 focus:border-blue-600 focus:ring-blue-600/10"
                  autoFocus
                />
                <p className="text-xs text-slate-500 text-center mt-2">
                  We&apos;ve sent a code to your email.
                </p>
              </div>
              <Button type="submit" className="w-full h-10 rounded-md font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all" disabled={isLoading || otp.length !== 6}>
                {isLoading ? "Verifying..." : "Verify & Sign In"}
              </Button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full text-xs font-semibold text-blue-600 hover:underline"
              >
                Back to password
              </button>
            </form>
          ) : (
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
                      <Label htmlFor="email" className="text-sm font-bold text-slate-700">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        autoComplete="email"
                        {...register("email")}
                        className={`rounded-md h-10 px-3 border-slate-300 focus:border-blue-600 focus:ring-blue-600/10 transition-all ${errors.email ? "border-red-500 focus-visible:ring-red-500/20" : ""}`}
                      />
                      {errors.email && <p className="text-red-500 text-xs font-medium mt-1">{errors.email.message}</p>}
                    </div>

                    <Button
                      onClick={handleContinue}
                      type="button"
                      className="w-full h-10 rounded-md font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
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
                        autoComplete="current-password"
                        {...register("password")}
                        className={`rounded-md h-10 px-3 border-slate-300 focus:border-blue-600 focus:ring-blue-600/10 transition-all ${errors.password ? "border-red-500 focus-visible:ring-red-500/20" : ""}`}
                      />
                      {errors.password && <p className="text-red-500 text-xs font-medium mt-1">{errors.password.message}</p>}
                    </div>

                    <Button type="submit" className="w-full h-10 rounded-md font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          )}

          {step === 1 && (
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              {role === "CUSTOMER" ? (
                <>
                  <p className="text-xs text-slate-500 font-medium mb-4">New to Mana Events?</p>
                  <Button variant="outline" className="w-full h-10 rounded-md font-bold text-sm border-slate-300 hover:bg-slate-50 text-slate-700" asChild>
                    <Link href="/register">Create Customer Account</Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-slate-500 font-medium mb-4">Not a Vendor?</p>
                  <Button variant="outline" className="w-full h-10 rounded-md font-bold text-sm border-slate-300 hover:bg-slate-50 text-slate-700" asChild>
                    <Link href="/vendor">Become a Vendor</Link>
                  </Button>
                </>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
