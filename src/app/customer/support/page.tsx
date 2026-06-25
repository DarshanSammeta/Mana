"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Mail,
  Phone,
  Search,
  ChevronRight,
  FileQuestion,
  LifeBuoy,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function CustomerSupport() {
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    { question: "How do I cancel a booking?", category: "Bookings" },
    { question: "What is the refund policy?", category: "Payments" },
    { question: "How to contact a vendor directly?", category: "Communication" },
    { question: "Can I reschedule my event?", category: "Bookings" },
  ];

  const contactOptions = [
    { title: "Live Chat", desc: "Instant help from our team", icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-500/10", action: "Start Chat" },
    { title: "Email Support", desc: "Response within 24 hours", icon: Mail, color: "text-blue-600", bg: "bg-blue-600/10", action: "Send Email" },
    { title: "Phone Call", desc: "Mon-Sat, 9am - 6pm", icon: Phone, color: "text-emerald-500", bg: "bg-emerald-500/10", action: "Call Now" },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 text-xs font-black uppercase tracking-widest">
            <LifeBuoy className="h-3 w-3" />
            24/7 Concierge
        </motion.div>
        <motion.h2 variants={item} className="text-5xl font-black tracking-tight">How can we help?</motion.h2>
        <motion.div variants={item} className="relative mt-8">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input
                placeholder="Search for articles, guides, or issues..."
                className="w-full h-16 pl-14 pr-6 rounded-[2rem] border-none shadow-2xl shadow-indigo-500/10 text-lg bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </motion.div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {contactOptions.map((option) => (
            <motion.div key={option.title} variants={item}>
                <GlassCard className="p-8 border-none flex flex-col items-center text-center group" animateHover>
                    <div className={`p-5 rounded-3xl ${option.bg} mb-6 transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                        <option.icon className={`h-8 w-8 ${option.color}`} />
                    </div>
                    <h3 className="text-xl font-black mb-2">{option.title}</h3>
                    <p className="text-sm text-muted-foreground mb-6">{option.desc}</p>
                    <Button variant="secondary" className="w-full rounded-xl font-bold">{option.action}</Button>
                </GlassCard>
            </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-10 pt-10">
        <div className="lg:col-span-2 space-y-6">
            <motion.h3 variants={item} className="text-2xl font-black flex items-center gap-3">
                <FileQuestion className="h-6 w-6 text-blue-600" />
                Frequently Asked Questions
            </motion.h3>
            <div className="grid gap-4">
                {faqs.map((faq, idx) => (
                    <motion.div key={idx} variants={item}>
                        <button className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-secondary/30 hover:bg-secondary/50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <Badge variant="outline" className="rounded-lg bg-background border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest">{faq.category}</Badge>
                                <span className="font-bold text-left">{faq.question}</span>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </button>
                    </motion.div>
                ))}
            </div>
            <motion.div variants={item} className="pt-4">
                <Button variant="link" className="text-blue-600 hover:text-blue-700 font-bold gap-2">
                    Browse Help Center
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </motion.div>
        </div>

        <div className="space-y-6">
             <motion.div variants={item}>
                <Card className="border-none shadow-xl bg-gradient-to-br from-blue-600 to-slate-900 text-white rounded-[2.5rem] overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <ShieldCheck className="h-32 w-32" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-white text-2xl">Safety First</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-blue-50/80 text-sm leading-relaxed">All our vendors are verified and payments are protected by Mana Escrow.</p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-xs font-bold bg-white/10 p-3 rounded-xl">
                                <Clock className="h-4 w-4" /> 100% Refundable Deposits
                            </div>
                            <div className="flex items-center gap-3 text-xs font-bold bg-white/10 p-3 rounded-xl">
                                <Sparkles className="h-4 w-4" /> Quality Guarantee
                            </div>
                        </div>
                    </CardContent>
                </Card>
             </motion.div>

             <motion.div variants={item}>
                <GlassCard className="p-6 border-none" animateHover>
                    <h4 className="font-black mb-4">Quick Support Ticket</h4>
                    <div className="space-y-4">
                        <Input placeholder="Subject" className="rounded-xl border-secondary" />
                        <textarea
                            placeholder="Describe your issue..."
                            className="w-full min-h-[100px] rounded-xl border border-secondary bg-transparent p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <Button className="w-full rounded-xl gap-2 font-bold" variant="premium">
                            <Send className="h-4 w-4" />
                            Submit Ticket
                        </Button>
                    </div>
                </GlassCard>
             </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
