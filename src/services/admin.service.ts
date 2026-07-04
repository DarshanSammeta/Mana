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
  }
};
