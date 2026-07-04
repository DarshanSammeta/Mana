import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { optimizeImage } from '@/lib/cloudinary';
import { IMAGES } from '@/constants';

interface FeaturedVendorsProps {
  vendors: any[];
}

export default function FeaturedVendors({ vendors }: FeaturedVendorsProps) {
  return (
    <section className="max-w-[1500px] mx-auto px-4 lg:px-6 mt-6">
      <div className="bg-white p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-[21px] font-bold text-[#111827]">Recommended for you</h2>
          <Link href="/marketplace" className="text-sm font-medium text-[#007185] hover:text-[#C7511F] hover:underline">See all</Link>
        </div>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-6 pb-4">
            {vendors?.map((vendor: any) => (
              <Link key={vendor.id} href={`/marketplace/vendor/${vendor.id}`} className="w-[160px] group inline-block">
                <div className="relative aspect-square mb-2 overflow-hidden bg-gray-50 flex items-center justify-center p-2">
                  <Image
                    src={optimizeImage(vendor.coverImage, 'thumbnail') || IMAGES.DEFAULT_EVENT}
                    alt={vendor.businessName}
                    width={160}
                    height={160}
                    className="object-contain max-h-full transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <p className="text-[13px] font-medium text-[#007185] hover:text-[#C7511F] hover:underline truncate mb-1">{vendor.businessName}</p>
                <div className="flex items-center gap-1 mb-1">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < Math.floor(vendor.rating || 4.5) ? 'fill-[#FFA41C] text-[#FFA41C]' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <span className="text-[12px] text-[#007185]">{vendor.reviewCount || 0}</span>
                </div>
                <p className="text-[17px] font-medium text-[#0F1111]">
                  <span className="text-xs align-top mt-1 mr-0.5">₹</span>
                  {vendor.basePrice?.toLocaleString()}
                </p>
              </Link>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </section>
  );
}
