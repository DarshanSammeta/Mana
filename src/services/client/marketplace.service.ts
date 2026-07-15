import apiClient from "@/lib/apiClient";
import { MarketplaceFilters, MarketplaceVendor } from "@/types/marketplace";

export const marketplaceService = {
  async getEventTypes(): Promise<any[]> {
    const res = await apiClient.get("/event-types");
    return Array.isArray(res.data) ? res.data : [];
  },

  async getCategories(eventTypeId?: string): Promise<any[]> {
    const url = eventTypeId ? `/event-types/${eventTypeId}/categories` : "/categories";
    const res = await apiClient.get(url);
    return res.data;
  },

  async getSubcategories(categoryId: string): Promise<any[]> {
    const res = await apiClient.get(`/categories/${categoryId}/subcategories`);
    return res.data;
  },

  async getServiceTypes(subcategoryId: string): Promise<any[]> {
    const res = await apiClient.get(`/subcategories/${subcategoryId}/service-types`);
    return res.data;
  },

  async getTrendingSearches(): Promise<string[]> {
    const res = await apiClient.get("/search/trending");
    return res.data;
  },

  async getSearchSuggestions(query: string): Promise<any[]> {
    const res = await apiClient.get(`/search/suggestions?q=${encodeURIComponent(query)}`);
    return res.data;
  },

  async searchVendors(filters: MarketplaceFilters): Promise<{ vendors: MarketplaceVendor[], total: number }> {
    const res = await apiClient.get("/marketplace", { params: filters });
    return res.data;
  },

  async getVendorById(id: string): Promise<any> {
    const res = await apiClient.get(`/marketplace/${id}`);
    return res.data;
  },

  async getRecommendations(): Promise<any> {
    const res = await apiClient.get("/vendors/recommendations");
    return res.data;
  }
};
