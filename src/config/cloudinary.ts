export const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
};

export const IMAGE_FALLBACKS = {
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
  thumbnail: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=250',
  card: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=600',
  hero: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1920',
  gallery: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200'
};
