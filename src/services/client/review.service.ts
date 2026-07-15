import apiClient from "@/lib/apiClient";

export const reviewService = {
  createReview: async (reviewData: any) => {
    const { data } = await apiClient.post("/reviews", reviewData);
    return data;
  },

  getVendorReviews: async (vendorId: string, params?: { page?: number; limit?: number }) => {
    const { data } = await apiClient.get(`/reviews?vendorId=${vendorId}`, { params });
    return data;
  },

  getCustomerReviews: async () => {
    const { data } = await apiClient.get("/customer/reviews");
    return data;
  },

  replyToReview: async (reviewId: string, reply: string) => {
    const { data } = await apiClient.patch(`/reviews/${reviewId}`, { reply });
    return data;
  },

  getReviews: async (type: 'VENDOR' | 'CUSTOMER', params?: { page?: number; limit?: number }) => {
    const endpoint = type === 'VENDOR' ? '/vendor/reviews' : '/customer/reviews';
    const { data } = await apiClient.get(endpoint, { params });
    return data;
  },
};
