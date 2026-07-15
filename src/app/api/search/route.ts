import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import logger from "@/lib/logger";

export async function GET(req: Request) {
  return withErrorHandler(async () => {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || searchParams.get("q") || "";
    const category = searchParams.get("category");
    const city = searchParams.get("city");

    logger.info("Search request received", { query, category, city });

    if (query.length < 2 && !category && !city) {
      return NextResponse.json({ vendors: [], services: [] });
    }

    const [vendors, services] = await Promise.all([
      prisma.vendorprofile.findMany({
        where: {
          OR: [
            { businessName: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
          ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
          verificationStatus: "APPROVED",
        },
        take: 10,
        select: {
          id: true,
          businessName: true,
          city: true,
          rating: true,
          logo: true,
        },
      }),
      prisma.service.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
          vendorprofile: {
            verificationStatus: "APPROVED",
            ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
          },
          ...(category ? { servicetype: { subcategory: { category: { name: category } } } } : {}),
        },
        take: 10,
        select: {
          id: true,
          title: true,
          description: true,
          basePrice: true,
          vendorprofile: {
            select: {
              businessName: true,
              city: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({ vendors, services });
  }, req);
}
