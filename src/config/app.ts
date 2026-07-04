export const APP_CONFIG = {
  name: "Mana Event",
  description: "One stop solution for all your event needs",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  cronSecret: process.env.CRON_SECRET,
};

export const ENV = {
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
};
