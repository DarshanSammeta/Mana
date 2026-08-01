import { verifyAccessToken as coreVerifyAccessToken } from "./auth-core";

/**
 * Edge-compatible wrapper for token verification.
 * Used primarily by Middleware.
 */
export const verifyAccessToken = async (token: string) => {
  return await coreVerifyAccessToken(token);
};
