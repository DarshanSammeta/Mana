import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';

interface CategoryIconsProps {
  eventTypes: any[];
}

export default function CategoryIcons({ eventTypes }: CategoryIconsProps) {
  return (
    <section className="max-w-[1500px] mx-auto px-4 lg:px-6 mt-6">
      <div className="bg-white p-6 shadow-sm border border-gray-200">
        <h2 className="text-[21px] font-bold text-[#111827] mb-6">Explore Event Categories</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
          {eventTypes?.map((type: any) => (
            <Link key={type.id} href={`/marketplace?eventTypeId=${type.id}`} className="flex flex-col items-center group">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#F7F8F8] flex items-center justify-center mb-2 group-hover:bg-[#EDF2F2] transition-colors border border-gray-100 overflow-hidden relative">
                {type.image ? (
                  <Image
                    src={type.image}
                    alt={type.name}
                    fill
                    sizes="(max-width: 768px) 64px, 80px"
                    className="object-cover"
                  />
                ) : (
                  <Sparkles className="h-8 w-8 text-[#6C3CF0]" />
                )}
              </div>
              <span className="text-[12px] md:text-[13px] font-medium text-center text-[#0F1111] group-hover:text-[#C7511F]">{type.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
