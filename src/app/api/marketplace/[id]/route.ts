import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const vendor = await prisma.vendorprofile.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        businessName: true,
        description: true,
        logo: true,
        coverImage: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        latitude: true,
        longitude: true,
        serviceRadius: true,
        gstNumber: true,
        bankDetails: true,
        verificationStatus: true,
        commissionRate: true,
        rating: true,
        reviewCount: true,
        completionRate: true,
        responseTime: true,
        totalBookings: true,
        searchScore: true,
        user: {
          select: { fullName: true, email: true, mobileNumber: true }
        },
        service: {
          select: {
            id: true,
            title: true,
            description: true,
            pricingType: true,
            basePrice: true,
            Renamedpackage: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                inclusions: true
              }
            },
            servicetype: {
              select: {
                id: true,
                name: true,
                subcategory: {
                  select: {
                    id: true,
                    name: true,
                    category: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        portfolio: {
          select: {
            id: true,
            mediaUrl: true,
            mediaType: true,
            title: true
          }
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: { select: { fullName: true } }
          },
          orderBy: { createdAt: "desc" }
        },
        availability: {
          where: {
            date: { gte: new Date() }
          },
          take: 30,
          orderBy: { date: "asc" }
        },
      }
    });

    if (!vendor) {
      return NextResponse.json({ message: "Vendor not found" }, { status: 404 });
    }

    // Get similar vendors (same primary category)
    const primaryCategoryId = vendor.service?.[0]?.servicetype?.subcategory?.category?.id;
    let similarVendors: any[] = [];

    if (primaryCategoryId) {
      similarVendors = await prisma.vendorprofile.findMany({
        where: {
          id: { not: id },
          verificationStatus: "APPROVED",
          service: {
            some: {
              servicetype: {
                subcategory: {
                  categoryId: primaryCategoryId
                }
              }
            }
          }
        },
        take: 4,
        select: {
          id: true,
          businessName: true,
          coverImage: true,
          city: true,
          rating: true,
          reviewCount: true,
          service: {
            select: {
              id: true,
              title: true,
              basePrice: true,
              Renamedpackage: {
                select: {
                  price: true
                }
              }
            }
          }
        }
      });
    }

    const similarVendorsMapped = similarVendors.map(v => {
      // Find the lowest price among all services and their packages
      const prices: number[] = [];
      v.service.forEach((s: any) => {
        if (s.Renamedpackage && s.Renamedpackage.length > 0) {
          s.Renamedpackage.forEach((p: any) => prices.push(Number(p.price)));
        } else if (s.basePrice) {
          prices.push(Number(s.basePrice));
        }
      });

      const startingPrice = prices.length > 0 ? Math.min(...prices) : 0;

      return {
        id: v.id,
        businessName: v.businessName,
        coverImage: v.coverImage,
        rating: v.rating ? Number(v.rating).toFixed(1) : "0.0",
        reviewCount: v.reviewCount || 0,
        basePrice: startingPrice.toString(),
        city: v.city
      };
    });

    return NextResponse.json({
      vendor,
      similarVendors: similarVendorsMapped
    });
  } catch (error: any) {
    console.error("Vendor Profile API Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
