import { prisma } from '@/lib/prisma';
import { haversineDistance } from '@/lib/maps/googleMaps';

export interface RankingFactors {
  rating: number;         // 30%
  reviewCount: number;    // 20%
  distance: number;       // 20%
  availability: number;   // 20%
  completionRate: number; // 10%
}

export const calculateVendorScore = (factors: RankingFactors): number => {
  // Normalize factors (0-1 scale)
  // Distance: closer is better, so we use an inverse relationship or a cap
  const normalizedDistance = Math.max(0, 1 - factors.distance / 50); // Cap at 50km

  // Rating: already 0-5, normalize to 0-1
  const normalizedRating = factors.rating / 5;

  // ReviewCount: normalize (e.g., 100+ reviews is 1)
  const normalizedReviews = Math.min(factors.reviewCount / 100, 1);

  // Availability: binary or fractional (here we assume 1 for available)
  const normalizedAvailability = factors.availability;

  // CompletionRate: already 0-1
  const normalizedCompletion = factors.completionRate;

  const score = (
    (normalizedRating * 0.30) +
    (normalizedReviews * 0.20) +
    (normalizedDistance * 0.20) +
    (normalizedAvailability * 0.20) +
    (normalizedCompletion * 0.10)
  ) * 100;

  return parseFloat(score.toFixed(2));
};

export const getRankedVendors = async (
  lat: number,
  lng: number,
  category?: string,
  maxDistance: number = 20 // default 20km
) => {
  const vendors = await prisma.vendorprofile.findMany({
    where: {
      verificationStatus: 'APPROVED',
      latitude: { not: null },
      longitude: { not: null },
      service: category ? {
        some: {
          servicetype: {
            subcategory: {
              category: {
                name: category
              }
            }
          }
        }
      } : undefined
    },
    include: {
      user: {
        select: {
          fullName: true
        }
      },
      service: {
        include: {
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
      vendorsubscription: {
        include: {
          subscriptionplan: true
        }
      }
    }
  });

  const rankedVendors = vendors.map(vendor => {
    const distance = haversineDistance(
      lat,
      lng,
      vendor.latitude!,
      vendor.longitude!
    );

    // If vendor has a service radius, respect it
    if (vendor.serviceRadius && distance > vendor.serviceRadius) {
      return null;
    }

    if (distance > maxDistance) {
      return null;
    }

    const subscriptionRank = vendor.vendorsubscription?.subscriptionplan?.rank || 0;

    const score = calculateVendorScore({
      rating: vendor.rating,
      reviewCount: vendor.reviewCount,
      distance: distance,
      availability: 1, // Assume available for simple ranking, more complex check needed for specific dates
      completionRate: vendor.completionRate
    });

    return {
      ...vendor,
      distance,
      score,
      subscriptionRank
    };
  }).filter(v => v !== null)
    .sort((a, b) => {
      // First sort by subscription rank (primary)
      if (b!.subscriptionRank !== a!.subscriptionRank) {
        return b!.subscriptionRank - a!.subscriptionRank;
      }
      // Then sort by score (secondary)
      return b!.score - a!.score;
    });

  return rankedVendors;
};
