"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Crown, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import Script from "next/script";
import { useAuthStore } from "@/store/authStore";
import { vendorService } from "@/services/client";
import { RAZORPAY_CONFIG } from "@/config/razorpay";

interface SubscriptionClientProps {
  initialData: any;
}

export default function SubscriptionClient({ initialData }: SubscriptionClientProps) {
  const queryClient = useQueryClient();
  const { user, accessToken } = useAuthStore();

  const { data } = useQuery({
    queryKey: ["vendor-subscription"],
    queryFn: () => vendorService.getSubscription(),
    initialData,
    enabled: !!accessToken,
    refetchOnMount: false
  });

  const upgradeMutation = useMutation({
    mutationFn: async (planId: string) => {
      // Need specialized endpoint for razorpay order in service layer
      const order = await vendorService.createSubscriptionOrder(planId);

      return new Promise((resolve, reject) => {
        const options = {
          key: RAZORPAY_CONFIG.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "Mana Events",
          description: "Vendor Subscription Upgrade",
          order_id: order.id,
          handler: async (response: any) => {
            try {
              const verifyRes = await vendorService.verifySubscriptionPayment({
                ...response,
                planId
              });
              resolve(verifyRes);
            } catch (err) {
              reject(err);
            }
          },
          prefill: {
            name: user?.fullName || "",
            email: user?.email || "",
          },
          theme: {
            color: "#2563EB",
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      });
    },
    onSuccess: () => {
      toast.success("Subscription upgraded successfully!");
      queryClient.invalidateQueries({ queryKey: ["vendor-subscription"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Payment failed");
    }
  });

  const { currentSubscription, plans, usage } = data;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Membership & Plans</h1>
          <p className="text-muted-foreground font-medium">Elevate your business with Mana Events premium features.</p>
        </div>
        {currentSubscription && (
          <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <ShieldCheck className="text-white h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">Active Plan</p>
              <p className="text-lg font-black text-foreground">{currentSubscription.subscriptionplan.name} Plan</p>
              <p className="text-[11px] text-muted-foreground font-bold">Expires: {format(new Date(currentSubscription.endDate), "PPP")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Service Listings</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-foreground">{usage.services}</span>
            <span className="text-muted-foreground font-bold pb-1">/ {usage.limit === -1 ? '∞' : usage.limit} used</span>
          </div>
          <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
             <div
               className="h-full bg-primary transition-all"
               style={{ width: `${usage.limit === -1 ? 100 : (usage.services / usage.limit) * 100}%` }}
             />
          </div>
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {plans.map((plan: any) => {
          const isCurrent = currentSubscription?.planId === plan.id;
          const isBetter = plan.rank > (currentSubscription?.subscriptionplan.rank || 0);
          const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col bg-card border-2 rounded-3xl p-6 transition-all ${
                isCurrent ? 'border-primary shadow-xl shadow-primary/10' : 'border-border hover:border-primary/50'
              }`}
            >
              {plan.name === "PREMIUM" && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-accent/20">
                  <Crown className="h-3 w-3" /> Recommended
                </div>
              )}

              <div className="mb-8">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">₹{plan.price}</span>
                  <span className="text-muted-foreground font-bold text-sm">/mo</span>
                </div>
              </div>

              <div className="space-y-4 flex-1 mb-8">
                {features.map((feature: string, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <p className="text-sm font-bold text-foreground/80 leading-tight">{feature}</p>
                  </div>
                ))}
              </div>

              <button
                disabled={isCurrent || !isBetter || upgradeMutation.isPending}
                onClick={() => upgradeMutation.mutate(plan.id)}
                className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                  isCurrent
                    ? 'bg-success/10 text-success border border-success/20 cursor-default'
                    : !isBetter
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20'
                }`}
              >
                {isCurrent ? 'Current Plan' : !isBetter ? 'Included' : 'Upgrade Now'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-muted/50 border border-border p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-card border border-border flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-black text-foreground">Safe & Secure Payments</p>
            <p className="text-xs text-muted-foreground font-medium">All transactions are encrypted and processed securely through Razorpay.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
