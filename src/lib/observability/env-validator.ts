const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXT_PUBLIC_APP_URL",
];

const OPTIONAL_ENV_VARS = [
  "RESEND_API_KEY",
  "CLOUDINARY_URL",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
];

export function validateEnv() {
  console.log("🔍 Validating Environment Variables...");
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
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  } else {
    console.log("✅ All required environment variables are set.");
  }

  if (warnings.length > 0) {
    console.warn("⚠️ WARNING: Missing optional environment variables (some features may be disabled):");
    warnings.forEach(v => console.warn(`   - ${v}`));
  }

  console.log("--------------------------------------------------");
}
