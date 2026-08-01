export const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
};

export const IMAGE_FALLBACKS = {
  avatar: '/placeholders/avatar.png',
  thumbnail: '/placeholders/thumbnail.jpg',
  card: '/placeholders/card.jpg',
  hero: '/placeholders/hero.jpg',
  gallery: '/placeholders/gallery.jpg'
};
