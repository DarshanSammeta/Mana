import apiClient from "@/lib/apiClient";

export const notificationService = {
  getNotifications: async (limit = 20, cursor?: string) => {
    const response = await apiClient.get("/notifications", {
      params: { limit, cursor }
    });
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await apiClient.patch("/notifications", { notificationIds: [id] });
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.patch("/notifications", { all: true });
    return response.data;
  },

  deleteNotification: async (id: string) => {
    const response = await apiClient.delete("/notifications", { data: { id } });
    return response.data;
  },

  deleteAllNotifications: async () => {
    const response = await apiClient.delete("/notifications", { data: { all: true } });
    return response.data;
  },

  getPreferences: async () => {
    const response = await apiClient.get("/notifications/preferences");
    return response.data;
  },

  updatePreferences: async (preferences: any) => {
    const response = await apiClient.patch("/notifications/preferences", preferences);
    return response.data;
  }
};
