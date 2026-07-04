import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccessToken } from "@/lib/auth";
import {
  getVendorBaseContext,
  getVendorStats,
  getVendorSubscriptionData,
  getVendorAssignments,
  getVendorRecentBookings
} from "@/lib/vendor";
import DashboardClient from "./DashboardClient";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/vendor/DashboardSkeleton";

export default async function VendorDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    redirect("/login?callbackUrl=/vendor/dashboard");
  }

  const payload = verifyAccessToken(token);
  if (!payload || payload.role !== "VENDOR") {
    redirect("/login");
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <VendorDashboardDataWrapper userId={payload.userId} token={token} />
    </Suspense>
  );
}

async function VendorDashboardDataWrapper({ userId, token }: { userId: string, token: string }) {
  // 1. Fetch the base context once
  const baseContext = await getVendorBaseContext(userId);

  if (!baseContext?.vendorprofile) {
    redirect("/onboarding/vendor");
  }

  const vendorId = baseContext.vendorprofile.id;
  const walletId = baseContext.wallet?.id;
  const totalBookings = baseContext.vendorprofile._count.booking;

  // 2. Fetch specific dashboard sections using IDs from the base context
  const [stats, subscription, assignments, recentBookings] = await Promise.all([
    getVendorStats(walletId, totalBookings),
    getVendorSubscriptionData(baseContext.vendorprofile),
    getVendorAssignments(vendorId),
    getVendorRecentBookings(vendorId)
  ]);

  return (
    <DashboardClient
      initialStats={stats}
      initialSubscription={subscription}
      initialAssignments={assignments}
      initialRecentBookings={recentBookings}
      accessToken={token}
    />
  );
}
