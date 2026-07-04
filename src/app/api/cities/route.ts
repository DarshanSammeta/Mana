import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const getCachedCities = unstable_cache(
  async () => {
    const cities = await prisma.vendorprofile.findMany({
      where: {
        verificationStatus: 'APPROVED'
      },
      select: {
        city: true
      },
      distinct: ['city'],
      orderBy: {
        city: 'asc'
      }
    });

    return cities
      .map(v => v.city)
      .filter((city): city is string => !!city && city.trim() !== "");
  },
  ['approved-cities'],
  { revalidate: 3600, tags: ['cities'] }
);

export async function GET() {
  try {
    const cityList = await getCachedCities();
    return NextResponse.json(cityList);
  } catch (error) {
    console.error("Failed to fetch cities:", error);
    return NextResponse.json({ error: "Failed to fetch cities" }, { status: 500 });
  }
}
