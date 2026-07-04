"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { popularLocations } from "@/data/home/locations";
import { useEffect, useState } from "react";

export default function PopularLocations() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className="py-24 bg-secondary/20">
        <div className="max-w-[1500px] mx-auto px-4">
          <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-[2rem]" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-secondary/20">
      <div className="max-w-[1500px] mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-black mb-6">Popular Locations</h2>
            <p className="text-muted-foreground text-lg font-medium">
              We are expanding rapidly across India. Find the best event professionals in your city.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {popularLocations.map((loc, i) => (
            <motion.div
              key={loc.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/marketplace?city=${loc.name}`} className="group relative block overflow-hidden rounded-[2rem] aspect-[4/3] shadow-lg">
                <Image
                  src={loc.image}
                  alt={loc.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-primary fill-primary" />
                    <h3 className="text-xl font-bold">{loc.name}</h3>
                  </div>
                  <p className="text-sm font-semibold text-white/80">{loc.count} Vendors</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
