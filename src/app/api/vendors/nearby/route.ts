import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lng = parseFloat(searchParams.get('lng') || '0');
  const radius = parseFloat(searchParams.get('radius') || '50'); // km
  const category = searchParams.get('category');
  const subcategory = searchParams.get('subcategory');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Coordinates required' }, { status: 400 });
  }

  try {
    const vendors = await prisma.vendorprofile.findMany({
      where: {
        verificationStatus: 'APPROVED',
        latitude: { not: null },
        longitude: { not: null },
        ...(category || subcategory ? {
          service: {
            some: {
              servicetype: {
                subcategory: {
                  OR: [
                    subcategory ? { name: subcategory } : {},
                    category ? { category: { name: category } } : {}
                  ].filter(obj => Object.keys(obj).length > 0) as any
                }
              }
            }
          }
        } : {})
      },
      select: {
        id: true,
        businessName: true,
        logo: true,
        city: true,
        latitude: true,
        longitude: true,
        rating: true,
        reviewCount: true,
        coverImage: true,
        service: {
          take: 1,
          select: {
            basePrice: true,
            servicetype: {
              select: {
                name: true
              }
            }
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

    const nearbyVendors = vendors.map(vendor => {
      const distance = getDistance(lat, lng, vendor.latitude!, vendor.longitude!);

      return {
        ...vendor,
        distance,
      };
    }).filter(v => v.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    return NextResponse.json(nearbyVendors);
  } catch (error: any) {
    console.error("Nearby API Error:", error);
    return NextResponse.json({ error: 'Failed to fetch vendors', message: error.message }, { status: 500 });
  }
}
