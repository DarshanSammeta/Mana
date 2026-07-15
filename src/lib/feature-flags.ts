import { redis } from "./redis";

export type FeatureFlag =
  | "AI_RECOMMENDATIONS"
  | "LIVE_TRACKING"
  | "MARKETING_CAMPAIGNS"
  | "WALLET_SYSTEM"
  | "COUPON_ENGINE"
  | "REFERRAL_SYSTEM"
  | "NOTIFICATIONS"
  | "CHAT_SYSTEM"
  | "PLANNING_WORKSPACE"
  | "MAINTENANCE_MODE";

const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
  AI_RECOMMENDATIONS: true,
  LIVE_TRACKING: true,
  MARKETING_CAMPAIGNS: true,
  WALLET_SYSTEM: true,
  COUPON_ENGINE: true,
  REFERRAL_SYSTEM: true,
  NOTIFICATIONS: true,
  CHAT_SYSTEM: true,
  PLANNING_WORKSPACE: true,
  MAINTENANCE_MODE: false,
};

export async function isFeatureEnabled(flag: FeatureFlag): Promise<boolean> {
  try {
    if (!redis) return DEFAULT_FLAGS[flag];

    const value = await redis.get(`feature_flag:${flag}`);
    if (value === null) return DEFAULT_FLAGS[flag];

    return value === "true" || value === true;
  } catch (error) {
    console.error(`Error checking feature flag ${flag}:`, error);
    return DEFAULT_FLAGS[flag];
  }
}

export async function setFeatureFlag(flag: FeatureFlag, enabled: boolean): Promise<void> {
  if (!redis) return;
  await redis.set(`feature_flag:${flag}`, String(enabled));
}

export async function getAllFeatureFlags(): Promise<Record<string, boolean>> {
  const flags: Record<string, boolean> = { ...DEFAULT_FLAGS };

  if (redis) {
    try {
      const keys = Object.keys(DEFAULT_FLAGS) as FeatureFlag[];
      const pipeline = redis.pipeline();
      keys.forEach(key => pipeline.get(`feature_flag:${key}`));
      const results = await pipeline.exec();

      keys.forEach((key, index) => {
        const val = results[index];
        if (val !== null) {
          flags[key] = val === "true" || val === true;
        }
      });
    } catch (error) {
      console.error("Error fetching all feature flags:", error);
    }
  }

  return flags;
}
