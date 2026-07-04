import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { optimizeImage } from '@/lib/cloudinary';
import { IMAGES } from '@/constants';

interface TrendingDealsProps {
  vendors: any[];
}

export default function TrendingDeals({ vendors }: TrendingDealsProps) {
  return (
    <section className="max-w-[1500px] mx-auto px-4 lg:px-6 mt-6">
      <div className="bg-white p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-[21px] font-bold text-[#111827]">Today&apos;s Trending Deals</h2>
          <Link href="/marketplace?sort=offers" className="text-sm font-medium text-[#007185] hover:text-[#C7511F] hover:underline">See all deals</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {vendors?.slice(0, 6).map((vendor: any) => (
            <Link key={vendor.id} href={`/marketplace/vendor/${vendor.id}`} className="group flex flex-col">
              <div className="relative aspect-square bg-gray-50 mb-3 overflow-hidden flex items-center justify-center p-2 border border-gray-100">
                <Image
                  src={optimizeImage(vendor.coverImage, 'thumbnail') || IMAGES.DEFAULT_EVENT}
                  alt={vendor.businessName}
                  width={200}
                  height={200}
                  className="object-contain max-h-full group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
                <div className="absolute top-0 left-0 bg-[#CC0C39] text-white text-[12px] font-bold px-2 py-1">
                  Up to 20% off
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#CC0C39] text-white text-[12px] font-bold px-1.5 py-0.5 rounded-sm">Limited time deal</span>
              </div>
              <p className="text-[17px] font-medium text-[#0F1111] mb-1">
                <span className="text-xs align-top mt-1 mr-0.5">₹</span>
                {(vendor.basePrice * 0.8).toLocaleString()}
                <span className="text-[13px] text-gray-500 font-normal line-through ml-2">₹{vendor.basePrice?.toLocaleString()}</span>
              </p>
              <h3 className="text-[13px] text-[#0F1111] line-clamp-2 leading-tight">{vendor.businessName} - Premium Service Package</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
