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
import VerificationStatusPage from "@/components/vendor/VerificationStatusPage";
import ErrorBoundary from "@/components/common/ErrorBoundary";

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
    <ErrorBoundary name="Vendor Dashboard">
      <Suspense fallback={<DashboardSkeleton />}>
        <VendorDashboardDataWrapper userId={payload.userId} token={token} />
      </Suspense>
    </ErrorBoundary>
  );
}

async function VendorDashboardDataWrapper({ userId, token }: { userId: string, token: string }) {
  // 1. Fetch the base context once
  const baseContext = await getVendorBaseContext(userId);

  if (!baseContext?.vendorprofile) {
    redirect("/vendor/onboarding");
  }

  const status = baseContext.vendorprofile.verificationStatus;

  // Protect Dashboard: Only APPROVED vendors can see the full dashboard
  if (status !== "APPROVED") {
    return (
      <VerificationStatusPage
        status={status}
        rejectionReason={baseContext.vendorprofile.rejectionReason}
        rejectedDocuments={baseContext.vendorprofile.rejectedDocuments as string[]}
      />
    );
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
