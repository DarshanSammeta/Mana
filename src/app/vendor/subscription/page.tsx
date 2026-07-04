import { getAuthPayload } from "@/lib/auth";
import { getVendorSubscription } from "@/lib/vendor";
import { redirect } from "next/navigation";
import SubscriptionClient from "./SubscriptionClient";

export default async function SubscriptionPage() {
  const payload = await getAuthPayload();

  if (!payload || payload.role !== "VENDOR") {
    redirect("/auth/login");
  }

  const data = await getVendorSubscription(payload.userId);

  if (!data) {
    redirect("/vendor/dashboard");
  }

  return <SubscriptionClient initialData={JSON.parse(JSON.stringify(data))} />;
}
