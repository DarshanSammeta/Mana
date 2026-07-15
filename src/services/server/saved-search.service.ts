import "server-only";
import { getPrisma } from "@/lib/prisma";

if (typeof window !== "undefined") {
  throw new Error("saved-search.service can only be used on the server.");
}
import { inngest } from "@/lib/inngest";

export class SavedSearchService {
  static async saveSearch(userId: string, data: { name?: string; filters: any; query?: string }) {
    const prisma = getPrisma();
    const savedSearch = await prisma.saved_search.create({
      data: {
        userId,
        name: data.name || data.query || "Saved Search",
        filters: data.filters,
        query: data.query,
      },
    });

    // Trigger background check for matches (optional immediate check)
    await inngest.send({
      name: "search/saved",
      data: {
        userId,
        savedSearchId: savedSearch.id,
      },
    });

    return savedSearch;
  }

  static async getSavedSearches(userId: string) {
    const prisma = getPrisma();
    return await prisma.saved_search.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async deleteSavedSearch(userId: string, id: string) {
    const prisma = getPrisma();
    return await prisma.saved_search.delete({
      where: { id, userId },
    });
  }
}
