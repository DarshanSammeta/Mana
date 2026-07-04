import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface CategoryGridProps {
  eventTypes: any[];
}

export default function CategoryGrid({ eventTypes }: CategoryGridProps) {
  const categoryCards = eventTypes?.slice(0, 4).map((type: any) => ({
    title: type.name,
    link: `/marketplace?eventTypeId=${type.id}&eventName=${type.name}`,
    items: type.categories?.slice(0, 4).map((cat: any) => ({
      name: cat.name,
      image: cat.image || `https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=400`,
      link: `/marketplace?eventTypeId=${type.id}&eventName=${type.name}&category=${cat.name}`
    })) || [],
    cta: `Explore all ${type.name}`,
  })) || [];

  return (
    <section className="max-w-[1500px] mx-auto px-4 lg:px-6 mt-0 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
        {categoryCards.map((card: any, idx: number) => (
          <div key={idx} className="bg-white p-5 shadow-sm flex flex-col h-full border border-gray-200">
            <h2 className="text-[21px] font-bold text-[#111827] mb-3 leading-tight">{card.title}</h2>
            <div className="grid grid-cols-2 gap-3 flex-1">
              {card.items.map((item: any, i: number) => (
                <Link key={i} href={item.link} className="group flex flex-col">
                  <div className="relative aspect-square overflow-hidden mb-1 bg-gray-100">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-[12px] text-gray-700 line-clamp-1 group-hover:text-[#C7511F]">{item.name}</p>
                </Link>
              ))}
            </div>
            <Link href={card.link} className="mt-4 text-[13px] font-medium text-[#007185] hover:text-[#C7511F] hover:underline transition-colors">
              {card.cta}
            </Link>
          </div>
        ))}

        {categoryCards.length === 0 && (
          <div className="bg-white p-5 shadow-sm border border-gray-200">
            <h2 className="text-[21px] font-bold text-[#111827] mb-3">Welcome to Mana Events</h2>
            <p className="text-sm text-gray-600 mb-4">Discover the best event professionals in your city.</p>
            <Link href="/login">
              <button className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-black border border-[#FCD200] rounded-lg py-2 shadow-sm font-medium">
                Sign in securely
              </button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
