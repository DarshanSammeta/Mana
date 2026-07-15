/**
 * Authentication Rate Limiting Configuration
 * Enterprise-grade security with developer-friendly defaults
 */

const isDev = process.env.NODE_ENV === 'development';
// devMultiplier removed as it is unused

export const AUTH_LIMITS = {
  // Login: 5 attempts / 15 minutes (Prod)
  LOGIN: {
    limit: isDev
      ? (parseInt(process.env.AUTH_LOGIN_LIMIT || '100', 10))
      : 5,
    window: isDev
      ? (parseInt(process.env.AUTH_LOGIN_WINDOW || '60', 10))
      : 15 * 60,
  },

  // Register: 10 / hour (Prod)
  REGISTER: {
    limit: isDev
      ? (parseInt(process.env.AUTH_REGISTER_LIMIT || '50', 10))
      : 10,
    window: isDev
      ? (parseInt(process.env.AUTH_REGISTER_WINDOW || '60', 10))
      : 60 * 60,
  },

  // OTP Send: 5 / hour (Prod)
  OTP_SEND: {
    limit: isDev
      ? (parseInt(process.env.AUTH_OTP_LIMIT || '50', 10))
      : 5,
    window: isDev
      ? (parseInt(process.env.AUTH_OTP_WINDOW || '60', 10))
      : 60 * 60,
  },

  // OTP Verify: 10 / 10 minutes (Prod)
  OTP_VERIFY: {
    limit: isDev
      ? (parseInt(process.env.AUTH_VERIFY_LIMIT || '100', 10))
      : 10,
    window: isDev
      ? (parseInt(process.env.AUTH_VERIFY_WINDOW || '60', 10))
      : 10 * 60,
  },

  // Forgot Password: 5 / hour (Prod)
  FORGOT_PASSWORD: {
    limit: isDev
      ? (parseInt(process.env.AUTH_FORGOT_LIMIT || '20', 10))
      : 5,
    window: isDev
      ? (parseInt(process.env.AUTH_FORGOT_WINDOW || '60', 10))
      : 60 * 60,
  },

  // Booking Verification OTP: 5 / hour (Prod)
  BOOKING_OTP: {
    limit: isDev ? 50 : 5,
    window: isDev ? 60 : 60 * 60,
  },

  // Booking Verification OTP Verify: 10 / 10 minutes (Prod)
  BOOKING_VERIFY: {
    limit: isDev ? 100 : 10,
    window: isDev ? 60 : 10 * 60,
  }
};

/**
 * Log startup configuration
 */
export function logAuthLimits() {
  console.log(`\n✓ Auth Rate Limiter Loaded`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Login Limit: ${AUTH_LIMITS.LOGIN.limit} requests / ${AUTH_LIMITS.LOGIN.window / 60} min`);
  console.log(`OTP Limit: ${AUTH_LIMITS.OTP_SEND.limit} requests / ${AUTH_LIMITS.OTP_SEND.window / 60} min\n`);
}
