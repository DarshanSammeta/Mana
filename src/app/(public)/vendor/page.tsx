"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function VendorLandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === "VENDOR") {
      router.push("/vendor/dashboard");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 py-24 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),theme(colors.slate.900))] opacity-20" />
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Grow your business with <span className="text-blue-400">Mana Events</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Join the most trusted event marketplace. List your services, manage bookings, and grow your brand with our powerful vendor tools.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-500 font-bold h-12 px-8">
                <Link href="/register?role=VENDOR">Register as Vendor</Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="text-white hover:text-blue-400 font-bold h-12">
                <Link href="/login?role=VENDOR" className="flex items-center gap-2">
                  Login as Vendor <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600 uppercase tracking-widest">Everything you need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Built for event professionals
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {[
                {
                  title: "Smart Bookings",
                  description: "Manage all your event bookings in one place with automated scheduling and reminders.",
                },
                {
                  title: "Secure Payments",
                  description: "Get paid on time with our secure payment gateway and automated payout system.",
                },
                {
                  title: "Marketing Tools",
                  description: "Increase your visibility with featured listings and advanced analytics.",
                },
              ].map((feature) => (
                <div key={feature.title} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-bold leading-7 text-slate-900">
                    <CheckCircle2 className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                    {feature.title}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600 font-medium">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
