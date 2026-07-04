import { getAuthPayload } from "@/lib/auth";
import { getCustomerStats } from "@/lib/customer";
import { redirect } from "next/navigation";
import CustomerDashboardClient from "./CustomerDashboardClient";
import { Suspense } from "react";
import CustomerDashboardSkeleton from "@/components/customer/CustomerDashboardSkeleton";

export default async function CustomerDashboardPage() {
  const payload = await getAuthPayload();

  if (!payload || payload.role !== "CUSTOMER") {
    redirect("/auth/login");
  }

  return (
    <Suspense fallback={<CustomerDashboardSkeleton />}>
      <CustomerDashboardDataWrapper userId={payload.userId} />
    </Suspense>
  );
}

async function CustomerDashboardDataWrapper({ userId }: { userId: string }) {
  const stats = await getCustomerStats(userId);
  return <CustomerDashboardClient initialStats={stats} />;
}
