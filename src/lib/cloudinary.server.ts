import { v2 as cloudinary } from "cloudinary";

let isConfigured = false;

export const getCloudinary = () => {
  if (isConfigured) return cloudinary;

  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud_name || !api_key || !api_secret) {
    // During build, we don't want to throw, just warn if someone calls this.
    // At runtime, the upload will naturally fail with a descriptive error.
    console.warn("Cloudinary configuration is incomplete. Check environment variables.");
  }

  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
  });

  isConfigured = true;
  return cloudinary;
};

// Export the raw instance for type compatibility if needed,
// but always prefer getCloudinary()
export { cloudinary };
