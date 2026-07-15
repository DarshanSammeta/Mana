import { inngest } from "@/lib/inngest";
import { LoyaltyService } from "@/services/server";
import { NotificationService } from "@/lib/notifications";

export const onPointsEarned = inngest.createFunction(
  { id: "on-points-earned", triggers: [{ event: "loyalty/points.earned" }] },
  async ({ event, step }) => {
    const { userId, points, reason } = event.data;

    await step.run("award-points", async () => {
      await LoyaltyService.earnPoints(userId, points, reason);
    });

    await step.run("notify-user", async () => {
      await NotificationService.send({
        userId,
        title: "Points Earned! 🏆",
        message: `You've earned ${points} loyalty points for ${reason.toLowerCase().replace('_', ' ')}.`,
        category: "SYSTEM",
      });
    });
  }
);

export const onReferralSignup = inngest.createFunction(
  { id: "on-referral-signup", triggers: [{ event: "referral/signup" }] },
  async ({ event, step }) => {
    const { referredUserId, referralCode } = event.data;

    await step.run("process-referral", async () => {
      await LoyaltyService.handleReferral(referralCode, referredUserId);
    });
  }
);
