const REQUIRED_ENV_VARS = [
  "NODE_ENV",
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "MEILISEARCH_HOST",
  "MEILISEARCH_API_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "REDIS_URL",
  "RESEND_API_KEY",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
  "INNGEST_EVENT_KEY",
  "INNGEST_SIGNING_KEY",
  "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
];

const OPTIONAL_ENV_VARS = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "SLACK_WEBHOOK_URL",
  "LOG_LEVEL",
];

export function validateEnv() {
  if (process.env.SKIP_ENV_VALIDATION === "true") return;

  console.log("🔍 Validating Production Environment Variables...");
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const v of REQUIRED_ENV_VARS) {
    if (!process.env[v]) {
      missing.push(v);
    }
  }

  for (const v of OPTIONAL_ENV_VARS) {
    if (!process.env[v]) {
      warnings.push(v);
    }
  }

  if (missing.length > 0) {
    console.error("❌ CRITICAL: Missing required environment variables:");
    missing.forEach(v => console.error(`   - ${v}`));

    // Only crash in production
    if (process.env.NODE_ENV === "production") {
      console.error("!!! PROD DEPLOYMENT HALTED DUE TO MISSING CONFIG !!!");
      process.exit(1);
    }
  } else {
    console.log("✅ All critical production variables are set.");
  }

  if (warnings.length > 0 && process.env.NODE_ENV === "production") {
    console.warn("⚠️ WARNING: Missing optional production variables:");
    warnings.forEach(v => console.warn(`   - ${v}`));
  }

  console.log("--------------------------------------------------");
}
