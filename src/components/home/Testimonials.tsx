import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Ananya Sharma",
    role: "Bride",
    image: "https://i.pravatar.cc/150?u=ananya",
    rating: 5,
    review: "Mana Events made my wedding planning so stress-free. Finding the perfect photographer and decorator in one place was a lifesaver. Highly recommend their verified vendors!",
  },
  {
    name: "Rahul Verma",
    role: "Corporate Manager",
    image: "https://i.pravatar.cc/150?u=rahul",
    rating: 5,
    review: "We used Mana Events for our annual corporate retreat. The catering and sound lighting teams were professional and punctual. The best platform for event services.",
  },
  {
    name: "Priya Das",
    role: "Mother",
    image: "https://i.pravatar.cc/150?u=priya",
    rating: 4,
    review: "Booked a decorator for my daughter's first birthday. The theme was executed perfectly. The instant booking feature is great!",
  },
  {
    name: "Suresh Reddy",
    role: "Business Owner",
    image: "https://i.pravatar.cc/150?u=suresh",
    rating: 5,
    review: "The pricing transparency on Mana Events is unmatched. I knew exactly what I was paying for. The support team was also very helpful with my queries.",
  },
  {
    name: "Sneha Kapoor",
    role: "Event Host",
    image: "https://i.pravatar.cc/150?u=sneha",
    rating: 5,
    review: "Found the most amazing live band for my anniversary party through this portal. The quality of vendors here is truly premium.",
  },
  {
    name: "Vikram Malhotra",
    role: "Groom",
    image: "https://i.pravatar.cc/150?u=vikram",
    rating: 5,
    review: "Professional, reliable, and easy to use. Mana Events is the future of event planning in India. Five stars!",
  }
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-background overflow-hidden">
      <div className="max-w-[1500px] mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-black mb-6">What Our Customers Say</h2>
          <p className="text-muted-foreground text-lg font-medium">
            Join thousands of happy customers who have celebrated their special moments with us.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border p-8 rounded-[2.5rem] relative hover:shadow-2xl transition-all"
            >
              <Quote className="absolute top-8 right-8 h-10 w-10 text-primary/10" />

              <div className="flex gap-1 mb-6">
                {Array(5).fill(0).map((_, j) => (
                  <Star
                    key={j}
                    className={`h-4 w-4 ${j < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
                  />
                ))}
              </div>

              <p className="text-lg text-foreground/90 italic mb-8 leading-relaxed">
                "{testimonial.review}"
              </p>

              <div className="flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="h-14 w-14 rounded-full object-cover border-2 border-primary/20"
                />
                <div>
                  <h4 className="font-bold text-lg">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground font-semibold">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
