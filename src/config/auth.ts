export const AUTH_CONFIG = {
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "fallback_secret_for_build",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "fallback_refresh_secret_for_build",
  accessTokenExpiresIn: "1h",
  refreshTokenExpiresIn: "7d",
  passwordSaltRounds: 12,
};
