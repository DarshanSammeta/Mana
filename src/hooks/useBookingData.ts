import { useQuery } from "@tanstack/react-query";
import { marketplaceService, bookingService } from "@/services";

export const useEventTypes = () => {
  return useQuery({
    queryKey: ["event-types"],
    queryFn: () => marketplaceService.getEventTypes(),
  });
};

export const useCategories = (eventTypeId: string | null, vendorId?: string) => {
  return useQuery({
    queryKey: ["categories", eventTypeId, vendorId],
    queryFn: () => bookingService.getCategories(eventTypeId!, vendorId),
    enabled: !!eventTypeId,
  });
};

export const useSubcategories = (categoryId: string | null, vendorId?: string) => {
  return useQuery({
    queryKey: ["subcategories", categoryId, vendorId],
    queryFn: () => bookingService.getSubcategories(categoryId!, vendorId),
    enabled: !!categoryId,
  });
};

export const useServiceTypes = (subcategoryId: string | null, vendorId?: string) => {
  return useQuery({
    queryKey: ["serviceTypes", subcategoryId, vendorId],
    queryFn: () => bookingService.getServiceTypes(subcategoryId!, vendorId),
    enabled: !!subcategoryId,
  });
};

export const usePackages = (serviceTypeId: string | null, vendorId?: string) => {
  return useQuery({
    queryKey: ["packages", serviceTypeId, vendorId],
    queryFn: () => bookingService.getPackages(serviceTypeId!, vendorId),
    enabled: !!serviceTypeId,
  });
};
