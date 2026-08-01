import { useQuery } from "@tanstack/react-query";
import { marketplaceService, bookingService } from "@/services/client";

export const useEventTypes = (vendorId?: string, initialData?: any) => {
  return useQuery({
    queryKey: ["event-types", vendorId],
    queryFn: () => marketplaceService.getEventTypes(vendorId),
    initialData
  });
};

export const useCategories = (eventTypeId: string | null, vendorId?: string, initialData?: any) => {
  return useQuery({
    queryKey: ["categories", eventTypeId, vendorId],
    queryFn: () => bookingService.getCategories(eventTypeId!, vendorId),
    enabled: !!eventTypeId,
    staleTime: initialData ? 1000 * 60 * 5 : 0, // Use 5 min stale time if hydrated
    initialData
  });
};

export const useSubcategories = (categoryId: string | null, vendorId?: string) => {
  return useQuery({
    queryKey: ["subcategories", categoryId, vendorId],
    queryFn: () => bookingService.getSubcategories(categoryId!, vendorId),
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 5, // Static data can be cached longer
  });
};

export const useServiceTypes = (subcategoryId: string | null, vendorId?: string) => {
  return useQuery({
    queryKey: ["serviceTypes", subcategoryId, vendorId],
    queryFn: () => bookingService.getServiceTypes(subcategoryId!, vendorId),
    enabled: !!subcategoryId,
    staleTime: 1000 * 60 * 5,
  });
};

export const usePackages = (serviceTypeId: string | null, vendorId?: string) => {
  return useQuery({
    queryKey: ["packages", serviceTypeId, vendorId],
    queryFn: () => bookingService.getPackages(serviceTypeId!, vendorId),
    enabled: !!serviceTypeId,
    staleTime: 1000 * 60 * 5,
  });
};

export const usePackageAddons = (packageId: string | null) => {
  return useQuery({
    queryKey: ["packageAddons", packageId],
    queryFn: () => bookingService.getPackageAddons(packageId!),
    enabled: !!packageId,
    staleTime: 1000 * 60 * 5,
  });
};
