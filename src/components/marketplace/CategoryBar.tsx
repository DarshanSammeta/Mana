"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ResponsiveSubcategoryNav } from "./ResponsiveSubcategoryNav";

interface CategoryBarProps {
  categories: any[];
}

export function CategoryBar({ categories }: CategoryBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(true);

  const selectedCategory = searchParams?.get("category");
  const selectedSubcategory = searchParams?.get("subcategory");

  const activeCategoryData = categories?.find((c: any) => c.name === selectedCategory);

  const updateUrl = (newCategory?: string, newSubcategory?: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (newCategory) {
      params.set("category", newCategory);
      params.delete("subcategory");
      params.delete("page"); // Reset pagination on category change
    } else if (newSubcategory !== undefined) {
      if (newSubcategory) params.set("subcategory", newSubcategory);
      else params.delete("subcategory");
      params.delete("page");
    }
    router.push(`/marketplace?${params.toString()}`, { scroll: false });
  };

  if (!selectedCategory || !activeCategoryData) return null;

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
            <ResponsiveSubcategoryNav
              subcategories={activeCategoryData?.subcategory || []}
              selectedSubcategory={selectedSubcategory || null}
              onSelect={(name) => updateUrl(undefined, name)}
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
