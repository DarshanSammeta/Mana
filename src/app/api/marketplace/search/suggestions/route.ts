import { getPrisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { ApiResponse } from "@/lib/api-response";
import { withErrorHandler } from "@/lib/error-handler";

const querySchema = z.string().min(2).max(100);

const getCachedSuggestions = (query: string) =>
  unstable_cache(
    async () => {
      const prisma = getPrisma();
      // Parallel fetching for performance
      const [vendors, categories, services] = await Promise.all([
        prisma.vendorprofile.findMany({
          where: {
            verificationStatus: "APPROVED",
            businessName: { contains: query, mode: 'insensitive' }
          },
          take: 5,
          select: { id: true, businessName: true, city: true }
        }),
        prisma.category.findMany({
          where: { name: { contains: query, mode: 'insensitive' } },
          take: 3,
          select: { id: true, name: true }
        }),
        prisma.servicetype.findMany({
          where: { name: { contains: query, mode: 'insensitive' } },
          take: 4,
          select: { id: true, name: true }
        })
      ]);

      return [
        ...categories.map(c => ({ id: c.id, text: c.name, type: 'category' })),
        ...services.map(s => ({ id: s.id, text: s.name, type: 'service' })),
        ...vendors.map(v => ({ id: v.id, text: v.businessName, type: 'vendor', subtext: v.city }))
      ];
    },
    [`search-suggestions-${query}`],
    { revalidate: 3600 }
  )();

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const { searchParams } = new URL(req.url);
    const rawQuery = (searchParams.get("q") || "").trim();

    if (!rawQuery || rawQuery.length < 2) {
      return ApiResponse.legacy([]);
    }

    const query = querySchema.parse(rawQuery);
    const suggestions = await getCachedSuggestions(query);

    // Standardized for new UI, but legacy() for backward compatibility if needed
    // The instructions say "Standardize ... Return pagination metadata consistently"
    // But also "incremental conversion" and "maintain 100% backward compatibility"
    // I'll return the array directly using ApiResponse.legacy for now to avoid breaking frontend search bars.
    return ApiResponse.legacy(suggestions);
  }, req);
}
