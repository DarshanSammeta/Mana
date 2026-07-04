import apiClient from "@/lib/apiClient";
import { BookingInput } from "@/validations";
import { Booking } from "@/types";

export const bookingService = {
  async createBooking(data: BookingInput): Promise<Booking> {
    const res = await apiClient.post("/bookings", data);
    return res.data;
  },

  async getBooking(id: string): Promise<Booking> {
    const res = await apiClient.get(`/bookings/${id}`);
    return res.data;
  },

  async updateStatus(id: string, status: string) {
    const res = await apiClient.patch(`/bookings/${id}/status`, { status });
    return res.data;
  },

  async getCategories(eventTypeId: string, vendorId?: string) {
    const res = await apiClient.get(`/event-types/${eventTypeId}/categories`, { params: { vendorId } });
    return res.data;
  },

  async getSubcategories(categoryId: string, vendorId?: string) {
    const res = await apiClient.get(`/categories/${categoryId}/subcategories`, { params: { vendorId } });
    return res.data;
  },

  async getServiceTypes(subcategoryId: string, vendorId?: string) {
    const res = await apiClient.get(`/subcategories/${subcategoryId}/service-types`, { params: { vendorId } });
    return res.data;
  },

  async getPackages(serviceTypeId: string, vendorId?: string) {
    const res = await apiClient.get(`/service-types/${serviceTypeId}/packages`, { params: { vendorId } });
    return res.data;
  },

  async checkAvailability(vendorId: string, date: string) {
    const res = await apiClient.post("/vendor/availability/check", { vendorId, date });
    return res.data;
  }
};
