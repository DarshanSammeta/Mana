"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { optimizeImage } from "@/lib/cloudinary";

interface ServiceGalleryProps {
  images: string[];
  title: string;
}

export function ServiceGallery({ images, title }: ServiceGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const displayImages = images.length > 0
    ? images
    : ["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1000"];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnails Sidebar */}
      <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto max-h-[600px] no-scrollbar">
        {displayImages.map((img, idx) => (
          <button
            key={idx}
            onMouseEnter={() => setSelectedImage(idx)}
            onClick={() => setSelectedImage(idx)}
            className={cn(
              "relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0",
              selectedImage === idx ? "border-primary ring-2 ring-primary/20" : "border-slate-100 hover:border-slate-300"
            )}
          >
            <Image
              src={optimizeImage(img, 'avatar')}
              fill
              className="object-cover"
              alt={`${title} thumb ${idx}`}
              sizes="80px"
            />
          </button>
        ))}
      </div>

      {/* Main Image Viewport */}
      <div
        className="flex-1 relative aspect-[4/5] md:aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 cursor-zoom-in group"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
            style={{
              transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
              scale: isZoomed ? 2 : 1,
            }}
          >
            <Image
              src={optimizeImage(displayImages[selectedImage], 'gallery')}
              fill
              priority
              className={cn("object-cover transition-transform duration-200 ease-out", isZoomed ? "scale-100" : "scale-100")}
              alt={title}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </motion.div>
        </AnimatePresence>

        {/* Zoom Hint */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm">
          Roll over image to zoom
        </div>
      </div>
    </div>
  );
}
