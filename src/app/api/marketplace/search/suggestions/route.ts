import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

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
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").toLowerCase().trim();

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const suggestions = await getCachedSuggestions(query);
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Suggestions API Error:", error);
    return NextResponse.json({ message: "Error fetching suggestions" }, { status: 500 });
  }
}
