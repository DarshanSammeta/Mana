"use client";

import React from 'react';
import { useRecommendations } from '@/hooks/use-customer-experience';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';

export function RecommendationCarouselSection() {
  const { data: recommendations, isLoading } = useRecommendations();

  if (isLoading) return <div className="h-48 animate-pulse bg-gray-100 rounded-lg"></div>;
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold mb-6">Recommended For You</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {recommendations.map((vendor: any) => (
          <Link href={`/marketplace/vendor/${vendor.id}`} key={vendor.id}>
            <Card className="hover:shadow-lg transition-shadow overflow-hidden min-w-[200px]">
              <div className="relative h-40 w-full">
                <Image
                  src={vendor.logo || '/placeholder-vendor.png'}
                  alt={vendor.businessName}
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-3">
                <h3 className="font-semibold truncate">{vendor.businessName}</h3>
                <div className="flex items-center text-sm text-yellow-500 mt-1">
                  <Star className="w-4 h-4 fill-current mr-1" />
                  <span>{vendor.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-gray-400 ml-1">({vendor.reviewCount})</span>
                </div>
                <p className="text-sm text-gray-500 mt-1 truncate">{vendor.city}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default RecommendationCarouselSection;
