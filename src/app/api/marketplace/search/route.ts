import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const city = searchParams.get("city");
    const category = searchParams.get("category");
    const lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined;
    const lng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : undefined;

    // Search for vendors, categories, subcategories, services, and packages
    const vendors = await prisma.vendorprofile.findMany({
      where: {
        verificationStatus: "APPROVED",
        OR: [
          { businessName: { contains: query } },
          { description: { contains: query } },
          {
            service: {
              some: {
                OR: [
                  { title: { contains: query } },
                  { description: { contains: query } },
                  {
                    servicetype: {
                      OR: [
                        { name: { contains: query } },
                        {
                          subcategory: {
                            OR: [
                              { name: { contains: query } },
                              { category: { name: { contains: query } } }
                            ]
                          }
                        }
                      ]
                    }
                  },
                  {
                    Renamedpackage: {
                      some: {
                        OR: [
                          { name: { contains: query } },
                          { description: { contains: query } }
                        ]
                      }
                    }
                  }
                ]
              }
            }
          }
        ],
        ...(city ? { city: { contains: city } } : {}),
        ...(category ? {
          service: {
            some: {
              servicetype: {
                subcategory: {
                  OR: [
                    { name: category },
                    { category: { name: category } }
                  ]
                }
              }
            }
          }
        } : {})
      },
      include: {
        service: {
          include: {
            Renamedpackage: true,
            servicetype: {
              include: {
                subcategory: {
                  include: {
                    category: true
                  }
                }
              }
            }
          }
        },
        review: true,
        vendorsubscription: {
          include: {
            subscriptionplan: true
          }
        }
      }
    });

    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 0.5 - Math.cos(dLat) / 2 +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                (1 - Math.cos(dLon)) / 2;
      return R * 2 * Math.asin(Math.sqrt(a));
    };

    let results = vendors.map(v => {
      let distance = Infinity;
      if (lat !== undefined && lng !== undefined && v.latitude && v.longitude) {
        distance = getDistance(lat, lng, v.latitude, v.longitude);
      }

      const ratings = v.review.map(r => r.rating);
      const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
      const subRank = v.vendorsubscription?.subscriptionplan?.rank || 0;

      return {
        id: v.id,
        businessName: v.businessName,
        city: v.city,
        coverImage: v.coverImage,
        rating: avgRating,
        reviewCount: v.review.length,
        distance,
        totalBookings: v.totalBookings,
        service: v.service,
        verificationStatus: v.verificationStatus,
        subscriptionRank: subRank,
        isPremium: subRank >= 3,
        isPro: subRank >= 2
      };
    });

    // Ranking algorithm:
    // Tier-based priority (Subscription Rank)
    // Followed by: Distance (30%) + Rating (40%) + Popularity (30%) within tiers
    results.sort((a, b) => {
      // First sort by Subscription Rank (Highest first)
      if (b.subscriptionRank !== a.subscriptionRank) {
        return b.subscriptionRank - a.subscriptionRank;
      }

      // Then by score within the same tier
      if (lat !== undefined && lng !== undefined) {
        const scoreA = (a.distance === Infinity ? 100 : a.distance) * 0.3 - a.rating * 2 * 0.4 - (a.totalBookings || 0) * 0.3;
        const scoreB = (b.distance === Infinity ? 100 : b.distance) * 0.3 - b.rating * 2 * 0.4 - (b.totalBookings || 0) * 0.3;
        return scoreA - scoreB;
      }
      return (b.rating * 0.6 + (b.totalBookings || 0) * 0.4) - (a.rating * 0.6 + (a.totalBookings || 0) * 0.4);
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
