const getSecret = (key: string, fallback: string): string => {
  const value = process.env[key];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`CRITICAL ERROR: ${key} is not defined in production environment!`);
  }
  return value || fallback;
};

export const AUTH_CONFIG = {
  jwtAccessSecret: getSecret("JWT_ACCESS_SECRET", "fallback_secret_for_build"),
  jwtRefreshSecret: getSecret("JWT_REFRESH_SECRET", "fallback_refresh_secret_for_build"),
  accessTokenExpiresIn: "1h",
  refreshTokenExpiresIn: "7d",
  passwordSaltRounds: 12,
};
