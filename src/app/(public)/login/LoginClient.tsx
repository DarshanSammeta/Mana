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
import { useQueryClient } from "@tanstack/react-query";
import { Mail, Lock, Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const queryClient = useQueryClient();

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
        queryClient.invalidateQueries({ queryKey: ["cart", user.id] });
        queryClient.invalidateQueries({ queryKey: ["wishlist", user.id] });
      }).catch(mergeError => {
        console.error("Failed to merge commerce state:", mergeError);
        queryClient.invalidateQueries({ queryKey: ["cart", user.id] });
        queryClient.invalidateQueries({ queryKey: ["wishlist", user.id] });
      });
    } else {
        queryClient.invalidateQueries({ queryKey: ["cart", user.id] });
        queryClient.invalidateQueries({ queryKey: ["wishlist", user.id] });
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[460px]"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-2xl font-black tracking-tighter text-slate-900">
              mana<span className="text-blue-600">Events</span>
            </h1>
          </Link>
          <h2 className="text-[32px] font-bold text-slate-900 leading-tight mb-2">Welcome Back</h2>
          <p className="text-slate-500 font-medium">Sign in to continue your booking.</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10">
          {redirectMsg && step !== 3 && (
            <div className="mb-6 p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold text-center animate-in fade-in slide-in-from-top-1">
              {redirectMsg}
            </div>
          )}

          {step === 1 && (
            <div className="mb-8 relative p-1 bg-slate-100 rounded-full flex items-center">
              <motion.div
                layoutId="role-indicator"
                className="absolute inset-y-1 bg-blue-600 rounded-full shadow-md z-0"
                initial={false}
                animate={{
                  x: role === "CUSTOMER" ? 0 : "100%",
                  width: "50%",
                }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
              <button
                type="button"
                onClick={() => setRole("CUSTOMER")}
                className={cn(
                  "relative z-10 flex-1 py-2.5 text-sm font-bold transition-colors duration-200",
                  role === "CUSTOMER" ? "text-white" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setRole("VENDOR")}
                className={cn(
                  "relative z-10 flex-1 py-2.5 text-sm font-bold transition-colors duration-200",
                  role === "VENDOR" ? "text-white" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Vendor
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 3 ? (
              <motion.form
                key="otp-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleVerifyOTP}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <Label htmlFor="otp" className="text-sm font-bold text-slate-700">Verification Code</Label>
                    <p className="text-xs text-slate-500">We&apos;ve sent a 6-digit code to your email.</p>
                  </div>
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                    className="text-center text-3xl tracking-[0.5em] font-black h-16 rounded-xl border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all"
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 hover:opacity-90 shadow-lg shadow-blue-600/20 text-white transition-all active:scale-95 disabled:opacity-50"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Sign In"}
                </Button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to password
                </button>
              </motion.form>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">Email Address</Label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email address"
                            autoComplete="email"
                            {...register("email")}
                            className={cn(
                              "h-12 pl-12 pr-4 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all",
                              errors.email && "border-red-500 focus:ring-red-500/5"
                            )}
                          />
                        </div>
                        {errors.email && (
                          <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-[13px] font-medium ml-1">
                            {errors.email.message}
                          </motion.p>
                        )}
                      </div>

                      <Button
                        onClick={handleContinue}
                        type="button"
                        className="w-full h-12 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 hover:opacity-90 shadow-lg shadow-blue-600/20 text-white transition-all active:scale-95"
                      >
                        Continue
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <Mail className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-sm font-bold text-slate-700 truncate">{getValues("email")}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-xs text-blue-600 font-bold hover:underline shrink-0 ml-2"
                        >
                          Change
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center ml-1">
                          <Label htmlFor="password" className="text-sm font-bold text-slate-700">Password</Label>
                          <Link href="/forgot-password" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                            Forgot Password?
                          </Link>
                        </div>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                          <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            autoFocus
                            autoComplete="current-password"
                            {...register("password")}
                            className={cn(
                              "h-12 pl-12 pr-4 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all",
                              errors.password && "border-red-500 focus:ring-red-500/5"
                            )}
                          />
                        </div>
                        {errors.password && (
                          <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-[13px] font-medium ml-1">
                            {errors.password.message}
                          </motion.p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-12 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 hover:opacity-90 shadow-lg shadow-blue-600/20 text-white transition-all active:scale-95 disabled:opacity-50"
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            )}
          </AnimatePresence>

          {step === 1 && (
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500 font-medium">
                Don&apos;t have an account?{" "}
                <Link
                  href={role === "CUSTOMER" ? "/register" : "/vendor"}
                  className="text-blue-600 font-bold hover:text-blue-700 transition-colors"
                >
                  {role === "CUSTOMER" ? "Create Account" : "Become a Vendor"}
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Footer Terms */}
        <div className="mt-8 text-center space-y-4">
          <p className="text-[12px] text-slate-400 leading-relaxed max-w-[320px] mx-auto font-medium">
            By continuing, you agree to Mana Events <Link href="/terms" className="text-slate-500 hover:text-slate-700 underline decoration-slate-300">Terms of Service</Link> and <Link href="/privacy" className="text-slate-500 hover:text-slate-700 underline decoration-slate-300">Privacy Policy</Link>.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

