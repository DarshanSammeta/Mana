import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await axios.get("/api/categories");
      return res.data;
    },
  });
};

export const useSubcategories = (categoryId: string | null) => {
  return useQuery({
    queryKey: ["subcategories", categoryId],
    queryFn: async () => {
      const res = await axios.get(`/api/categories/${categoryId}/subcategories`);
      return res.data;
    },
    enabled: !!categoryId,
  });
};

export const useServiceTypes = (subcategoryId: string | null) => {
  return useQuery({
    queryKey: ["serviceTypes", subcategoryId],
    queryFn: async () => {
      const res = await axios.get(`/api/subcategories/${subcategoryId}/service-types`);
      return res.data;
    },
    enabled: !!subcategoryId,
  });
};

export const usePackages = (serviceTypeId: string | null, vendorId?: string) => {
  return useQuery({
    queryKey: ["packages", serviceTypeId, vendorId],
    queryFn: async () => {
      const res = await axios.get(`/api/service-types/${serviceTypeId}/packages`, {
        params: { vendorId },
      });
      return res.data;
    },
    enabled: !!serviceTypeId,
  });
};
