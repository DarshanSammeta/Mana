import apiClient from "@/lib/apiClient";

export const reviewService = {
  getReviews: async (role: 'VENDOR' | 'CUSTOMER') => {
    const response = await apiClient.get("/reviews", { params: { role } });
    return response.data;
  },

  submitReview: async (data: any) => {
    const response = await apiClient.post("/reviews", data);
    return response.data;
  },

  respondToReview: async (reviewId: string, vendorResponse: string) => {
    const response = await apiClient.patch(`/reviews/${reviewId}`, { vendorResponse });
    return response.data;
  }
};
