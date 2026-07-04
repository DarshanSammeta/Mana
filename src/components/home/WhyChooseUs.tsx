"use client";

import { motion } from "framer-motion";
import { whyChooseUsFeatures } from "@/data/home/features";
import { useEffect, useState } from "react";

export default function WhyChooseUs() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className="py-24 bg-background">
        <div className="max-w-[1500px] mx-auto px-4">
          <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-[2rem]" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-background">
      <div className="max-w-[1500px] mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-6">Why Choose Mana Events?</h2>
          <p className="text-muted-foreground text-lg md:text-xl font-medium">
            We are committed to making your event planning journey smooth, transparent, and memorable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {whyChooseUsFeatures.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2rem] bg-card border border-border hover:border-primary/50 hover:shadow-xl transition-all group"
            >
              <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-6 ${feature.color} group-hover:scale-110 transition-transform`}>
                <feature.icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
