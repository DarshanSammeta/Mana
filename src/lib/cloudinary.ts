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

  // Production Safety: Reject non-image / forbidden platforms
  const forbiddenKeywords = ["youtube.com", "youtu.be", "instagram.com", "facebook.com", "reels", ".mp4", ".pdf", ".html"];
  const lowerUrl = url.toLowerCase();
  if (forbiddenKeywords.some(k => lowerUrl.includes(k))) {
    return fallbacks[type] || fallbacks.card;
  }

  // Phase 8: Optimized Unsplash Handling
  if (url.includes('unsplash.com')) {
    const w = type === 'avatar' ? 150 : type === 'thumbnail' ? 250 : type === 'card' ? 600 : 1200;

    // Clean up existing parameters that might conflict (w, q, auto, fit)
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('w', w.toString());
      urlObj.searchParams.set('q', '80');
      urlObj.searchParams.set('auto', 'format');
      urlObj.searchParams.set('fit', 'crop');
      return urlObj.toString();
    } catch {
      // Fallback for relative URLs or malformed URLs
      return url.includes('?') ? `${url}&w=${w}&q=80&auto=format` : `${url}?w=${w}&q=80&auto=format`;
    }
  }

  // If not a cloudinary URL, return as is (but validated above)
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
