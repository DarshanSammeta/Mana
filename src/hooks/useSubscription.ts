import { useQuery } from "@tanstack/react-query";
import { vendorService } from "@/services";

export function useSubscription() {
  return useQuery({
    queryKey: ["vendor-subscription"],
    queryFn: () => vendorService.getSubscription(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function hasFeature(subscription: any, feature: string) {
  if (!subscription || !subscription.subscriptionplan) return false;
  const features = typeof subscription.subscriptionplan.features === 'string'
    ? JSON.parse(subscription.subscriptionplan.features)
    : subscription.subscriptionplan.features;

  return features.includes(feature);
}

export function checkListingLimit(usage: any) {
  if (!usage) return false;
  if (usage.limit === -1) return true;
  return usage.services < usage.limit;
}
