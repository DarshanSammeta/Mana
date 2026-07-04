import apiClient from "@/lib/apiClient";

export const chatService = {
  async getConversations() {
    const res = await apiClient.get("/chat/conversations");
    return res.data;
  },

  async getMessages(conversationId: string, cursor?: string) {
    const res = await apiClient.get(`/chat/messages`, {
      params: { conversationId, cursor }
    });
    return res.data;
  },

  async sendMessage(data: { conversationId: string; content: string; attachments?: any[] }) {
    const res = await apiClient.post("/chat/messages", data);
    return res.data;
  }
};
