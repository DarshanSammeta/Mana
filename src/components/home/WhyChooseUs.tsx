import { ShieldCheck, Zap, Award, Headset, CheckCircle, Star } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: ShieldCheck,
    title: "Verified Vendors",
    description: "Every vendor on our platform undergoes a rigorous background check and verification process.",
    color: "bg-blue-500/10 text-blue-500"
  },
  {
    icon: Award,
    title: "Best Price Guarantee",
    description: "Get the best market rates for all event services without any hidden charges or middleman fees.",
    color: "bg-amber-500/10 text-amber-500"
  },
  {
    icon: Zap,
    title: "Instant Booking",
    description: "Check real-time availability and book your favorite vendors instantly with a few clicks.",
    color: "bg-purple-500/10 text-purple-500"
  },
  {
    icon: CheckCircle,
    title: "Secure Payments",
    description: "Your money is safe with us. We use industry-standard encryption for all financial transactions.",
    color: "bg-green-500/10 text-green-500"
  },
  {
    icon: Star,
    title: "Trusted Reviews",
    description: "Read authentic reviews from real customers who have actually used the services.",
    color: "bg-red-500/10 text-red-500"
  },
  {
    icon: Headset,
    title: "24/7 Support",
    description: "Our dedicated support team is available around the clock to help you with any queries.",
    color: "bg-cyan-500/10 text-cyan-500"
  }
];

export default function WhyChooseUs() {
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
          {features.map((feature, i) => (
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
