import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { optimizeImage } from '@/lib/cloudinary';

interface CategoryIconsProps {
  eventTypes: any[];
}

export default function CategoryIcons({ eventTypes }: CategoryIconsProps) {
  if (!eventTypes || eventTypes.length === 0) return null;

  return (
    <section className="max-w-[1500px] mx-auto px-4 lg:px-6 mt-12 mb-12">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-black text-[#111827] tracking-tight">Explore Event Categories</h2>
          <p className="text-slate-500 font-medium mt-1">Discover the best professionals for your special occasion.</p>
        </div>
        <Link
          href="/marketplace"
          className="text-sm font-bold text-purple-600 hover:text-purple-700 uppercase tracking-widest border-b-2 border-purple-100 hover:border-purple-600 transition-all pb-1"
        >
          View All Categories
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {eventTypes.map((type: any) => (
          <Link
            key={type.id}
            href={`/marketplace?eventTypeId=${type.id}`}
            className="group relative block overflow-hidden rounded-[24px] aspect-video shadow-md hover:shadow-xl transition-all duration-500"
          >
            <Image
              src={optimizeImage(type.image, 'card')}
              alt={type.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity group-hover:opacity-90" />

            {/* Content */}
            <div className="absolute bottom-6 left-6 right-6">
              <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight">
                {type.name}
              </h3>
              <div className="h-1 w-0 bg-yellow-400 mt-2 group-hover:w-12 transition-all duration-500 rounded-full" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
