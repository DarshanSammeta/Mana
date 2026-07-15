import apiClient from "@/lib/apiClient";
import type { Booking, BookingStatus, BookingTeamMember } from "@/types/booking";

export const vendorService = {
  getStats: async () => {
    const response = await apiClient.get("/vendor/stats");
    return response.data;
  },

  getSubscription: async () => {
    const response = await apiClient.get("/vendor/subscription");
    return response.data;
  },

  getAssignments: async () => {
    const response = await apiClient.get("/vendor/assignments");
    return response.data;
  },

  handleAssignment: async (assignmentId: string, action: 'ACCEPT' | 'REJECT') => {
    const response = await apiClient.post(`/vendor/assignments/${assignmentId}/${action.toLowerCase()}`);
    return response.data;
  },

  getRecentBookings: async () => {
    const response = await apiClient.get("/vendor/bookings/recent");
    return response.data;
  },

  getServices: async () => {
    const response = await apiClient.get("/vendor/services");
    return response.data;
  },

  getServiceById: async (id: string) => {
    const response = await apiClient.get(`/vendor/services/${id}`);
    return response.data;
  },

  addService: async (data: any) => {
    const response = await apiClient.post("/vendor/services", data);
    return response.data;
  },

  updateService: async (id: string, data: any) => {
    const response = await apiClient.patch(`/vendor/services/${id}`, data);
    return response.data;
  },

  deleteService: async (id: string) => {
    const response = await apiClient.delete(`/vendor/services/${id}`);
    return response.data;
  },

  createSubscriptionOrder: async (planId: string) => {
    const response = await apiClient.post("/vendor/subscription/razorpay", { planId });
    return response.data;
  },

  verifySubscriptionPayment: async (data: any) => {
    const response = await apiClient.post("/vendor/subscription/verify", data);
    return response.data;
  },

  updateBookingStatus: async (bookingId: string, status: BookingStatus): Promise<Booking> => {
    const response = await apiClient.patch(`/bookings/${bookingId}/status`, { status });
    return response.data;
  },

  sendCounterQuote: async (bookingId: string, data: { totalAmount: number, notes?: string }): Promise<Booking> => {
    const response = await apiClient.patch(`/bookings/${bookingId}/negotiate`, data);
    return response.data;
  },

  getBookingById: async (id: string): Promise<Booking> => {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data;
  },

  getBookingTeam: async (id: string): Promise<BookingTeamMember[]> => {
    const response = await apiClient.get(`/bookings/${id}/team`);
    return response.data;
  },

  verifyBookingOtp: async (bookingId: string, otp: string): Promise<Booking> => {
    const response = await apiClient.patch("/bookings/otp", { bookingId, otp });
    return response.data;
  },

  addBookingTeamMember: async (bookingId: string, data: Omit<BookingTeamMember, "id">): Promise<BookingTeamMember> => {
    const response = await apiClient.post(`/bookings/${bookingId}/team`, data);
    return response.data;
  },

  removeBookingTeamMember: async (bookingId: string, staffId: string) => {
    const response = await apiClient.delete(`/bookings/${bookingId}/team`, { params: { staffId } });
    return response.data;
  },

  updateBookingAvailability: async (bookingId: string, available: boolean) => {
    const response = await apiClient.patch(`/bookings/${bookingId}/availability`, { available });
    return response.data;
  },

  requestBookingPhoneOtp: async (bookingId: string) => {
    const response = await apiClient.post(`/bookings/${bookingId}/otp/verification`);
    return response.data;
  },

  verifyBookingPhoneOtp: async (bookingId: string, otp: string) => {
    const response = await apiClient.patch(`/bookings/${bookingId}/otp/verification`, { otp });
    return response.data;
  },

  updateBookingChecklist: async (bookingId: string, checklist: any[]) => {
    const response = await apiClient.patch(`/bookings/${bookingId}/checklist`, { checklist });
    return response.data;
  },

  updateBookingLocation: async (bookingId: string, location: { latitude: number, longitude: number }) => {
    const response = await apiClient.post(`/bookings/${bookingId}/location`, location);
    return response.data;
  },

  getBookingLocation: async (bookingId: string) => {
    const response = await apiClient.get(`/bookings/${bookingId}/location`);
    return response.data;
  },

  getPortfolio: async () => {
    const response = await apiClient.get("/vendor/portfolio");
    return response.data;
  },

  addPortfolioItem: async (data: any) => {
    const response = await apiClient.post("/vendor/portfolio", data);
    return response.data;
  },

  deletePortfolioItem: async (id: string) => {
    const response = await apiClient.delete(`/vendor/portfolio/${id}`);
    return response.data;
  },

  getPackages: async (serviceId: string) => {
    const response = await apiClient.get("/vendor/packages", { params: { serviceId } });
    return response.data;
  },

  addPackage: async (data: any) => {
    const response = await apiClient.post("/vendor/packages", data);
    return response.data;
  },

  deletePackage: async (id: string) => {
    const response = await apiClient.delete(`/vendor/packages/${id}`);
    return response.data;
  },

  uploadMedia: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  getAvailability: async () => {
    const response = await apiClient.get("/vendor/availability");
    return response.data;
  },

  getRecurringAvailability: async () => {
    const response = await apiClient.get("/vendor/availability/recurring");
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get("/vendor/profile");
    return response.data;
  },

  updateAvailability: async (data: { date: string, isAvailable: boolean, startTime: string, endTime: string }) => {
    const response = await apiClient.post("/vendor/availability", data);
    return response.data;
  },

  updateRecurringAvailability: async (rules: any[]) => {
    const response = await apiClient.post("/vendor/availability/recurring", { rules });
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await apiClient.put("/vendor/profile", data);
    return response.data;
  },

  getCategories: async () => {
    const response = await apiClient.get("/categories");
    return response.data;
  },

  getReports: async (params: { type: string; from?: string; to?: string }) => {
    const response = await apiClient.get("/vendor/reports", { params });
    return response.data;
  },

  getReportSchedule: async () => {
    const response = await apiClient.get("/vendor/reports/schedule");
    return response.data;
  },

  updateReportSchedule: async (data: any) => {
    const response = await apiClient.post("/vendor/reports/schedule", data);
    return response.data;
  },

  getPackagesByService: async (serviceId: string) => {
    const response = await apiClient.get("/vendor/packages", { params: { serviceId } });
    return response.data;
  },

  getDocuments: async () => {
    const response = await apiClient.get("/vendor/documents");
    return response.data;
  },

  uploadDocument: async (data: { type: string, url: string }) => {
    const response = await apiClient.post("/vendor/documents", data);
    return response.data;
  },

  getVerificationStatus: async () => {
    const response = await apiClient.get("/vendor/verification-status");
    return response.data;
  },

  checkAvailability: async (data: { vendorId: string, date: string }) => {
    const response = await apiClient.post("/vendor/availability/check", data);
    return response.data;
  },

  getNearbyVendors: async (lat: number, lng: number, radius: number = 50) => {
    const response = await apiClient.get("/vendors/nearby", { params: { lat, lng, radius } });
    return response.data;
  },

  getEarnings: async () => {
    const response = await apiClient.get("/vendor/earnings");
    return response.data;
  },

  requestPayout: async (amount: number) => {
    const response = await apiClient.post("/payouts", { amount });
    return response.data;
  },

  getWallet: async () => {
    const response = await apiClient.get("/wallet");
    return response.data;
  },

  getTransactions: async (limit = 20, cursor?: string) => {
    const response = await apiClient.get("/wallet/transactions", {
      params: { limit, cursor }
    });
    return response.data;
  },

  getPayouts: async () => {
    const response = await apiClient.get("/payouts");
    return response.data;
  },

  getExpenses: async () => {
    const response = await apiClient.get("/vendor/expenses");
    return response.data;
  },

  addExpense: async (data: any) => {
    const response = await apiClient.post("/vendor/expenses", data);
    return response.data;
  },

  updateExpense: async (id: string, data: any) => {
    const response = await apiClient.patch(`/vendor/expenses/${id}`, data);
    return response.data;
  },

  deleteExpense: async (id: string) => {
    const response = await apiClient.delete(`/vendor/expenses/${id}`);
    return response.data;
  },

  getTeam: async () => {
    const response = await apiClient.get("/vendor/team");
    return response.data;
  },

  addTeamMember: async (data: any) => {
    const response = await apiClient.post("/vendor/team", data);
    return response.data;
  },

  updateTeamMember: async (id: string, data: any) => {
    const response = await apiClient.patch("/vendor/team", { id, ...data });
    return response.data;
  },

  removeTeamMember: async (id: string) => {
    const response = await apiClient.delete("/vendor/team", { params: { id } });
    return response.data;
  }
};
