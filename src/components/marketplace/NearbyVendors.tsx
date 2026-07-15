'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { vendorService } from '@/services/client';

interface Vendor {
  id: string;
  businessName: string;
  logo: string | null;
  rating: number;
  reviewCount: number;
  distance: number;
  city: string;
}

export const NearbyVendors = () => {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }, []);

  const { data: vendors, isLoading } = useQuery<Vendor[]>({
    queryKey: ['nearby-vendors', coords],
    queryFn: async () => {
      if (!coords) return [];
      return vendorService.getNearbyVendors(coords.lat, coords.lng);
    },
    enabled: !!coords,
  });

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />)}
  </div>;

  if (!vendors || vendors.length === 0) return (
    <div className="text-center py-10 text-muted-foreground">
      No vendors found within 20km of your location.
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {vendors.map((vendor, index) => (
        <motion.div
          key={vendor.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link href={`/vendors/${vendor.id}`}>
            <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="relative h-48 w-full">
                <Image
                  src={vendor.logo || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800'}
                  alt={vendor.businessName}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                    <Navigation className="h-3 w-3 mr-1" />
                    {vendor.distance != null ? vendor.distance.toFixed(1) : '0.0'} km
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg line-clamp-1">{vendor.businessName}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{vendor.city}</span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{vendor.rating != null ? vendor.rating.toFixed(1) : '0.0'}</span>
                    <span className="text-xs text-muted-foreground">({vendor.reviewCount})</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Verified
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );
};
