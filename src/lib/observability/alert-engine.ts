import logger from "../logger";
import { observability } from "../observability";

interface AlertConfig {
  threshold: number;
  windowMs: number;
  severity: "low" | "medium" | "high" | "critical";
}

const ALERTS: Record<string, AlertConfig> = {
  "database_down": { threshold: 1, windowMs: 0, severity: "critical" },
  "redis_down": { threshold: 1, windowMs: 0, severity: "critical" },
  "high_error_rate": { threshold: 50, windowMs: 60000, severity: "high" },
  "slow_api": { threshold: 2000, windowMs: 0, severity: "medium" },
  "payment_failure": { threshold: 5, windowMs: 300000, severity: "high" },
};

export class AlertEngine {
  static async trigger(alertKey: string, details: any) {
    const config = ALERTS[alertKey];

    const alertData = {
      alertKey,
      severity: config?.severity || "medium",
      timestamp: new Date().toISOString(),
      details,
      environment: process.env.NODE_ENV,
    };

    // Log the alert
    logger.error(`[ALERT] ${alertKey.toUpperCase()}`, alertData);

    // Track in metrics
    observability.trackError(alertKey, "AlertEngine");

    // Integration points (Slack, PagerDuty, etc.)
    if (process.env.SLACK_WEBHOOK_URL) {
      await this.sendToSlack(alertData);
    }

    if (config?.severity === "critical" || config?.severity === "high") {
       // Could trigger SMS via Twilio here if needed
    }
  }

  private static async sendToSlack(data: any) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🚨 *${data.alertKey}* (${data.severity})\n\`\`\`${JSON.stringify(data.details, null, 2)}\`\`\``,
        }),
      });
    } catch (error) {
      console.error("Failed to send alert to Slack", error);
    }
  }
}
