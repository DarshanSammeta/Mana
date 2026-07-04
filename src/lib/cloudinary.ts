/**
 * Standardizes image transformations for consistent performance and quality across the app.
 * Uses Cloudinary's dynamic URL transformation.
 *
 * NOTE: This function is safe to use in client components as it only performs string manipulation.
 * Server-side SDK (cloudinary v2) should only be imported in .server.ts or API routes.
 */
import { IMAGE_FALLBACKS } from "@/config/cloudinary";

export const optimizeImage = (url: string | undefined | null, type: 'avatar' | 'thumbnail' | 'card' | 'hero' | 'gallery' = 'card') => {
  const fallbacks = IMAGE_FALLBACKS;

  if (!url || typeof url !== 'string' || url.trim() === '' || url === 'undefined' || url === 'null') {
    return fallbacks[type] || fallbacks.card;
  }

  // If not a cloudinary URL, return as is
  if (!url.includes('res.cloudinary.com')) return url;

  const transformations: Record<string, string> = {
    avatar: 'w_150,h_150,c_fill,g_face,q_auto,f_auto',
    thumbnail: 'w_250,h_167,c_fill,q_auto,f_auto',
    card: 'w_600,h_400,c_fill,q_auto,f_auto',
    hero: 'w_1920,h_1080,c_limit,q_auto,f_auto',
    gallery: 'w_1200,h_800,c_limit,q_auto,f_auto'
  };

  const transform = transformations[type] || transformations.card;

  // Cloudinary URL structure: https://res.cloudinary.com/[cloud_name]/image/upload/[transformations]/[version]/[public_id]
  return url.replace('/upload/', `/upload/${transform}/`);
};
