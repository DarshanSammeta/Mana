import apiClient from "@/lib/apiClient";
import { LoginFormInput } from "@/validations";

export const authService = {
  login: async (data: LoginFormInput) => {
    const response = await apiClient.post("/auth/login", data);
    return response.data;
  },

  verifyOtp: async (data: { userId: string; otp: string }) => {
    const response = await apiClient.post("/auth/verify-otp", data);
    return response.data;
  },

  register: async (data: any) => {
    const response = await apiClient.post("/auth/register", data);
    return response.data;
  },

  mergeCommerce: async (data: { cartItems: any[]; wishlistItems: any[] }) => {
    const response = await apiClient.post("/commerce/merge", data);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post("/auth/logout");
    return response.data;
  }
};
