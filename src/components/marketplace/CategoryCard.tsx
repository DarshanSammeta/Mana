"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface CategoryCardProps {
  title: string;
  items: { name: string; image: string; link: string }[];
  footerLabel?: string;
  footerLink?: string;
}

export function CategoryCard({ title, items, footerLabel, footerLink }: CategoryCardProps) {
  return (
    <div className="bg-white p-5 flex flex-col h-full shadow-sm">
      <h3 className="text-[21px] font-bold mb-3 text-slate-900 leading-tight h-[60px] flex items-center">{title}</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 flex-1">
        {items.slice(0, 4).map((item, idx) => (
          <Link key={idx} href={item.link} className="group flex flex-col cursor-pointer">
            <div className="aspect-square relative overflow-hidden bg-slate-50 mb-1">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:opacity-90"
              />
            </div>
            <span className="text-[12px] font-medium text-slate-900 line-clamp-1">{item.name}</span>
          </Link>
        ))}
      </div>
      {(footerLabel || footerLink) && (
        <Link href={footerLink || "/marketplace"} className="mt-6 text-[13px] font-medium text-[#007185] hover:text-[#c45500] hover:underline">
          {footerLabel || "See more"}
        </Link>
      )}
    </div>
  );
}
