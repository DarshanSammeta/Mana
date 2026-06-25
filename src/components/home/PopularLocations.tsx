import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import Link from "next/link";

const locations = [
  { name: "Hyderabad", count: "1,200+", image: "https://images.unsplash.com/photo-1595180639912-799d7a220268?w=800&auto=format&fit=crop" },
  { name: "Bangalore", count: "950+", image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&auto=format&fit=crop" },
  { name: "Chennai", count: "800+", image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop" },
  { name: "Mumbai", count: "1,500+", image: "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=800&auto=format&fit=crop" },
  { name: "Delhi", count: "1,800+", image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&auto=format&fit=crop" },
  { name: "Pune", count: "600+", image: "https://images.unsplash.com/photo-1594918732684-25e14b6480f2?w=800&auto=format&fit=crop" },
  { name: "Vijayawada", count: "350+", image: "https://images.unsplash.com/photo-1621259182978-f0331524935f?w=800&auto=format&fit=crop" },
  { name: "Visakhapatnam", count: "420+", image: "https://images.unsplash.com/photo-1626014303706-62d976375611?w=800&auto=format&fit=crop" },
];

export default function PopularLocations() {
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
          {locations.map((loc, i) => (
            <motion.div
              key={loc.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/marketplace?city=${loc.name}`} className="group relative block overflow-hidden rounded-[2rem] aspect-[4/3] shadow-lg">
                <img
                  src={loc.image}
                  alt={loc.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
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
