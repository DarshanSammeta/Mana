"use client";

import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { Sparkles, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ResponsiveSubcategoryNavProps {
  subcategories: any[];
  selectedSubcategory: string | null;
  onSelect: (name: string) => void;
}

export function ResponsiveSubcategoryNav({
  subcategories,
  selectedSubcategory,
  onSelect,
}: ResponsiveSubcategoryNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measurementRef = useRef<HTMLDivElement>(null);
  const moreBtnMeasureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isMeasured, setIsMeasured] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!isMounted || !containerRef.current || !measurementRef.current) return;

    const calculateVisible = () => {
      const container = containerRef.current;
      const measureContainer = measurementRef.current;
      if (!container || !measureContainer) return;

      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      if (containerWidth <= 0) return;

      const itemElements = Array.from(measureContainer.querySelectorAll('[data-measure-item]')) as HTMLElement[];
      const itemWidths = itemElements.map(el => el.getBoundingClientRect().width);

      const moreBtnWidth = moreBtnMeasureRef.current?.getBoundingClientRect().width || 100;
      const gap = 16; // gap-4 is 1rem = 16px

      if (itemWidths.length === 0 && subcategories.length > 0) return;

      let currentWidth = 0;
      let count = 0;
      let allFit = true;

      for (let i = 0; i < itemWidths.length; i++) {
        const itemWidth = itemWidths[i] + (i > 0 ? gap : 0);
        if (currentWidth + itemWidth <= containerWidth) {
          currentWidth += itemWidth;
          count++;
        } else {
          allFit = false;
          break;
        }
      }

      if (!allFit) {
        // Recalculate accounting for More button
        currentWidth = 0;
        count = 0;
        const limit = containerWidth - moreBtnWidth - gap;
        for (let i = 0; i < itemWidths.length; i++) {
          const itemWidth = itemWidths[i] + (i > 0 ? gap : 0);
          if (currentWidth + itemWidth <= limit) {
            currentWidth += itemWidth;
            count++;
          } else {
            break;
          }
        }
      }

      setVisibleCount(count);
      setIsMeasured(true);
    };

    const observer = new ResizeObserver(calculateVisible);
    observer.observe(containerRef.current);
    calculateVisible();

    // Font load can change item widths
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(calculateVisible);
    }

    return () => observer.disconnect();
  }, [isMounted, subcategories]);

  const visibleItems = subcategories.slice(0, visibleCount);
  const hiddenItems = subcategories.slice(visibleCount);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center gap-4 w-full overflow-hidden min-h-[140px] transition-opacity duration-300 ${
        !isMeasured ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Hidden container to measure all items */}
      <div
        ref={measurementRef}
        className="absolute top-0 left-0 invisible flex gap-4 pointer-events-none whitespace-nowrap overflow-hidden"
      >
        {subcategories.map((sub) => (
          <div
            key={`measure-${sub.id}`}
            data-measure-item
            className="flex flex-col items-center justify-center p-6 min-w-[140px] rounded-2xl border"
          >
            <div className="h-12 w-12 mb-4"><Sparkles /></div>
            <span className="text-[11px] font-black uppercase">{sub.name}</span>
          </div>
        ))}
        <div ref={moreBtnMeasureRef} className="flex flex-col items-center justify-center p-6 min-w-[100px] rounded-2xl border">
             <div className="h-12 w-12 mb-4"><MoreHorizontal /></div>
             <span className="text-[11px] font-black uppercase">More</span>
        </div>
      </div>

      {/* Actual visible items */}
      <div className="flex gap-4 items-center flex-nowrap overflow-hidden">
        {visibleItems.map((sub) => (
          <button
            key={sub.id}
            onClick={() => onSelect(sub.name)}
            className={`flex flex-col items-center justify-center p-6 min-w-[140px] rounded-2xl border transition-all duration-300 group shrink-0 ${
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

      {hiddenItems.length > 0 && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              className={`flex flex-col items-center justify-center p-6 min-w-[100px] rounded-2xl border transition-all duration-300 group shrink-0 ${
                hiddenItems.some(item => item.name === selectedSubcategory)
                  ? "border-blue-600 bg-blue-50 shadow-md transform scale-105 z-10"
                  : "border-slate-100 bg-white hover:border-blue-200 hover:shadow-lg"
              }`}
            >
              <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-4 transition-colors ${
                hiddenItems.some(item => item.name === selectedSubcategory) ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'
              }`}>
                <MoreHorizontal className="h-6 w-6" />
              </div>
              <span className={`text-[11px] font-black uppercase tracking-wider text-center transition-colors ${
                hiddenItems.some(item => item.name === selectedSubcategory) ? 'text-blue-700' : 'text-slate-600 group-hover:text-blue-600'
              }`}>More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 shadow-xl border-slate-200">
            {hiddenItems.map((sub) => (
              <DropdownMenuItem
                key={sub.id}
                onClick={() => onSelect(sub.name)}
                className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer mb-1 last:mb-0 transition-colors ${
                  selectedSubcategory === sub.name ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50'
                }`}
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                  selectedSubcategory === sub.name ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-[12px] font-black uppercase tracking-wider">{sub.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
