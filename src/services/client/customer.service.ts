import apiClient from "@/lib/apiClient";

export const customerService = {
  getStats: async () => {
    const response = await apiClient.get("/customer/stats");
    return response.data;
  },

  getBookings: async (params?: any) => {
    const response = await apiClient.get("/customer/bookings", { params });
    return response.data;
  },

  getWallet: async (limit = 20, cursor?: string) => {
    const response = await apiClient.get("/customer/wallet", {
        params: { limit, cursor }
    });
    return response.data;
  },

  getBookingById: async (id: string) => {
    const response = await apiClient.get(`/customer/bookings/${id}`);
    return response.data;
  },

  getInvoices: async () => {
    const response = await apiClient.get("/customer/invoices");
    return response.data;
  },

  getWishlist: async () => {
    const response = await apiClient.get("/customer/wishlist");
    return response.data;
  },

  addToWishlist: async (serviceId: string) => {
    const response = await apiClient.post("/customer/wishlist", { serviceId });
    return response.data;
  },

  removeFromWishlist: async (serviceId: string) => {
    const response = await apiClient.delete(`/customer/wishlist/${serviceId}`);
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await apiClient.patch("/customer/profile", data);
    return response.data;
  },

  getOrders: async (params?: any) => {
    const response = await apiClient.get("/customer/orders", { params });
    return response.data;
  },

  getOrderById: async (id: string) => {
    const response = await apiClient.get(`/customer/orders/${id}`);
    return response.data;
  },

  getCart: async () => {
    const response = await apiClient.get("/customer/cart");
    return response.data;
  },

  addToCart: async (data: { serviceId: string, packageId?: string, quantity: number }) => {
    const response = await apiClient.post("/customer/cart", data);
    return response.data;
  },

  removeFromCart: async (itemId: string) => {
    const response = await apiClient.delete(`/customer/cart/${itemId}`);
    return response.data;
  },

  checkout: async (data: any) => {
    const response = await apiClient.post("/customer/checkout", data);
    return response.data;
  },

  getAddresses: async () => {
    const response = await apiClient.get("/customer/addresses");
    return response.data;
  },

  addAddress: async (data: any) => {
    const response = await apiClient.post("/customer/addresses", data);
    return response.data;
  },

  deleteAddress: async (id: string) => {
    const response = await apiClient.delete(`/customer/addresses/${id}`);
    return response.data;
  },

  createRazorpayOrder: async (data: { amount: number }) => {
    const response = await apiClient.post("/checkout/razorpay", data);
    return response.data;
  },

  verifyRazorpayPayment: async (data: any) => {
    const response = await apiClient.post("/checkout/razorpay/verify", data);
    return response.data;
  },

  submitReview: async (data: { vendorId: string, rating: number, comment: string }) => {
    const response = await apiClient.post("/reviews", data);
    return response.data;
  },

  requestPhoneOtp: async (bookingId: string) => {
    const response = await apiClient.post(`/bookings/${bookingId}/otp/verification`);
    return response.data;
  },

  verifyPhoneOtp: async (bookingId: string, otp: string) => {
    const response = await apiClient.patch(`/bookings/${bookingId}/otp/verification`, { otp });
    return response.data;
  }
};
