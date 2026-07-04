"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface CategoryBarProps {
  categories: any[];
}

export function CategoryBar({ categories }: CategoryBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(true);

  const selectedCategory = searchParams?.get("category") || categories?.[0]?.name;
  const selectedSubcategory = searchParams?.get("subcategory");

  const activeCategoryData = categories?.find((c: any) => c.name === selectedCategory) || categories?.[0];

  const updateUrl = (newCategory?: string, newSubcategory?: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (newCategory) {
      params.set("category", newCategory);
      params.delete("subcategory");
    } else if (newSubcategory !== undefined) {
      if (newSubcategory) params.set("subcategory", newSubcategory);
      else params.delete("subcategory");
    }
    router.push(`/marketplace?${params.toString()}`, { scroll: false });
  };

  if (!selectedCategory) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-white border-b border-slate-200 overflow-hidden shadow-sm"
      >
        <div className="max-w-[1500px] mx-auto px-4 py-10 lg:px-6">
          <div className="flex items-end justify-between mb-10">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-[#111827] tracking-tight flex items-center gap-3">
                {selectedCategory}
                <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-100 text-[10px] font-black uppercase py-0.5">Explore Services</Badge>
              </h2>
              <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Select a specialized category to narrow your search</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 font-black hover:text-primary transition-colors uppercase tracking-widest text-[11px]"
            >
              {isExpanded ? "Minimize" : "Expand All"}
              <ChevronDown className={`ml-2 h-4 w-4 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {isExpanded && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-6">
              {activeCategoryData?.subcategory?.map((sub: any) => (
                <button
                  key={sub.id}
                  onClick={() => updateUrl(undefined, sub.name)}
                  className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 group ${
                    selectedSubcategory === sub.name
                      ? "border-blue-600 bg-blue-50 shadow-md transform scale-105 z-10"
                      : "border-slate-100 bg-white hover:border-blue-200 hover:shadow-lg"
                  }`}
                >
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-4 transition-colors ${
                    selectedSubcategory === sub.name ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'
                  }`}>
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <span className={`text-[11px] font-black uppercase tracking-wider text-center line-clamp-2 transition-colors ${
                    selectedSubcategory === sub.name ? 'text-blue-700' : 'text-slate-600 group-hover:text-blue-600'
                  }`}>{sub.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
