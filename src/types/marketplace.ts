export interface MarketplaceFilters {
  category?: string;
  eventTypeId?: string;
  city?: string;
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sort?: string;
  page?: number;
  limit?: number;
  cursor?: string;
  lat?: number;
  lng?: number;
  featured?: boolean;
}

export interface MarketplaceVendor {
  id: string;
  businessName: string;
  logo?: string;
  coverImage?: string;
  city?: string;
  rating: number;
  reviewCount: number;
  totalBookings: number;
  searchScore: number;
  featured: boolean;
  verificationStatus: string;
  latitude?: number;
  longitude?: number;
  basePrice: number;
  distance?: number;
  minPrice?: number;
  service: any[];
}
