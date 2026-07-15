import apiClient from "@/lib/apiClient";

export const adminService = {
  getDocuments: async () => {
    const response = await apiClient.get("/admin/documents");
    return response.data;
  },

  updateDocumentStatus: async (id: string, status: string, notes: string = "Admin review complete") => {
    const response = await apiClient.patch(`/admin/documents/${id}`, { status, notes });
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get("/admin/stats");
    return response.data;
  },

  getVendorDetails: async (id: string) => {
    const response = await apiClient.get(`/admin/vendors/${id}`);
    return response.data;
  },

  verifyVendor: async (vendorProfileId: string, data: {
    status: "APPROVED" | "REJECTED" | "CHANGES_REQUIRED";
    rejectionReason?: string;
    rejectedDocuments?: string[];
    comment?: string;
  }) => {
    const response = await apiClient.post(`/admin/vendors/verify/${vendorProfileId}`, data);
    return response.data;
  }
};
