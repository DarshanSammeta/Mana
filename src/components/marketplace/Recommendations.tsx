'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { marketplaceService } from '@/services/marketplace.service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from '@/components/ui/card';
import { Star, TrendingUp, Award, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export const Recommendations = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: () => marketplaceService.getRecommendations()
  });

  if (isLoading) return <div className="h-96 w-full bg-muted animate-pulse rounded-xl" />;

  const sections = [
    { id: 'topRated', label: 'Top Rated', icon: <Award className="h-4 w-4 mr-2" />, data: data?.topRated },
    { id: 'bestValue', label: 'Best Value', icon: <TrendingUp className="h-4 w-4 mr-2" />, data: data?.bestValue },
    { id: 'nearYou', label: 'Near You', icon: <MapPin className="h-4 w-4 mr-2" />, data: data?.nearYou },
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="topRated" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          {sections.map(s => (
            <TabsTrigger key={s.id} value={s.id} className="flex items-center">
              {s.icon} {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {sections.map(s => (
          <TabsContent key={s.id} value={s.id}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {s.data?.map((vendor: any) => (
                <Link key={vendor.id} href={`/vendors/${vendor.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <div className="relative h-40 w-full">
                      <Image
                        src={vendor.logo || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800'}
                        alt={vendor.businessName}
                        fill
                        className="object-cover rounded-t-lg"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-bold line-clamp-1">{vendor.businessName}</h4>
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{vendor.rating.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{vendor.totalBookings} bookings</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
