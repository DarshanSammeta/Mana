/**
 * PRODUCTION ENVIRONMENT AUDIT SCRIPT
 * Checks for all required environment variables for Phase 18 Go-Live.
 */

const REQUIRED_VARS = {
  application: [
    "NODE_ENV",
    "NEXTAUTH_URL",
    "NEXT_PUBLIC_APP_URL",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "NEXTAUTH_SECRET"
  ],
  database: [
    "DATABASE_URL",
    "DIRECT_URL"
  ],
  redis: [
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN"
  ],
  search: [
    "MEILISEARCH_HOST",
    "MEILISEARCH_API_KEY"
  ],
  storage: [
    "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET"
  ],
  payment: [
    "NEXT_PUBLIC_RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET"
  ],
  email: [
    "RESEND_API_KEY"
  ],
  sms: [
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_PHONE_NUMBER"
  ],
  maps: [
    "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
  ],
  background: [
    "INNGEST_EVENT_KEY",
    "INNGEST_SIGNING_KEY"
  ]
};

function audit() {
  console.log("=== PRODUCTION ENVIRONMENT AUDIT ===");
  let missingCount = 0;
  let presentCount = 0;

  for (const [category, vars] of Object.entries(REQUIRED_VARS)) {
    console.log(`\n[${category.toUpperCase()}]`);
    vars.forEach(v => {
      if (process.env[v]) {
        console.log(`✅ ${v} is set`);
        presentCount++;
      } else {
        console.warn(`❌ ${v} is MISSING`);
        missingCount++;
      }
    });
  }

  console.log("\n--- AUDIT SUMMARY ---");
  console.log(`Present: ${presentCount}`);
  console.log(`Missing: ${missingCount}`);

  if (missingCount === 0) {
    console.log("\nPASSED: All production environment variables are configured.");
  } else {
    console.error(`\nFAILED: ${missingCount} variables are missing. Please check your .env file.`);
  }
}

audit();
