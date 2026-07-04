import React from 'react';
import { homeStats } from "@/data/home/stats";

export default function HomeStats() {
  return (
    <section className="max-w-[1500px] mx-auto px-4 lg:px-6 mt-6 py-12 bg-[#6C3CF0] rounded-sm text-white">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {homeStats.map((stat, i) => (
          <div key={i}>
            <p className="text-4xl font-black mb-1">{stat.value}</p>
            <p className="text-sm font-bold uppercase tracking-widest text-white/90">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
