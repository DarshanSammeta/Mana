import apiClient from "@/lib/apiClient";

export const marketplaceService = {
  async getEventTypes(vendorId?: string): Promise<any[]> {
    const res = await apiClient.get("/event-types", { params: { vendorId } });
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
    const res = await apiClient.get(`/marketplace/services?query=${encodeURIComponent(query)}&limit=5`);
    return res.data.services.map((s: any) => ({
      text: s.title,
      category: s.category
    }));
  },

  async searchServices(filters: any): Promise<any> {
    const res = await apiClient.get("/marketplace/services", { params: filters });
    return res.data;
  },

  async getServiceById(id: string): Promise<any> {
    const res = await apiClient.get(`/services/${id}`);
    return res.data;
  },

  async getRecommendations(): Promise<any> {
    const res = await apiClient.get("/vendors/recommendations");
    return res.data;
  }
};
