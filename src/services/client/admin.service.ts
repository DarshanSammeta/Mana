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
  },

  approveVendor: async (id: string) => {
    const response = await apiClient.patch(`/admin/vendors/${id}/approve`);
    return response.data;
  },

  rejectVendor: async (id: string, reason: string, rejectedDocuments?: string[]) => {
    const response = await apiClient.patch(`/admin/vendors/${id}/reject`, { reason, rejectedDocuments });
    return response.data;
  },

  suspendVendor: async (id: string, reason: string) => {
    const response = await apiClient.patch(`/admin/vendors/${id}/suspend`, { reason });
    return response.data;
  },

  reactivateVendor: async (id: string) => {
    const response = await apiClient.patch(`/admin/vendors/${id}/reactivate`);
    return response.data;
  },

  getVendors: async (params?: { page?: number, limit?: number, status?: string, search?: string }) => {
    const response = await apiClient.get("/admin/vendors", { params });
    return response.data;
  },

  bulkVendorAction: async (data: { ids: string[], action: "APPROVE" | "REJECT" | "SUSPEND", reason?: string }) => {
    const response = await apiClient.post("/admin/vendors/bulk-action", data);
    return response.data;
  }
};
