import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { meiliClient } from "@/lib/meilisearch";
import { sendEmail } from "@/lib/mail";

export const monitorSystemHealth = inngest.createFunction(
  { id: "monitor-system-health", triggers: [{ cron: "*/5 * * * *" }] }, // Every 5 minutes
  async ({ step }) => {
    const issues: string[] = [];

    // 1. Check Database
    await step.run("check-database", async () => {
      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch {
        issues.push("CRITICAL: Database is unreachable.");
      }
    });

    // 2. Check Redis
    await step.run("check-redis", async () => {
      try {
        if (!redis) throw new Error("Redis not configured");
        await redis.ping();
      } catch {
        issues.push("WARNING: Redis is down. Performance may be degraded.");
      }
    });

    // 3. Check Meilisearch
    await step.run("check-meilisearch", async () => {
      try {
        if (!meiliClient) throw new Error("Meilisearch not configured");
        const healthy = await meiliClient.isHealthy();
        if (!healthy) throw new Error("Meilisearch unhealthy");
      } catch {
        issues.push("WARNING: Meilisearch is down. Search fallback active.");
      }
    });

    // 4. Check Recent Payment Failures
    await step.run("check-payment-failures", async () => {
      const failedCount = await prisma.payment.count({
        where: {
          status: "FAILED",
          createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } // Last 15 mins
        }
      });
      if (failedCount > 5) {
        issues.push(`ALERT: High payment failure rate (${failedCount} in 15 mins).`);
      }
    });

    // 5. Check BullMQ Health (Placeholder for enterprise monitoring)
    await step.run("check-queues", async () => {
        // In a real environment, we'd query BullMQ queue.getJobCounts()
        // For now, we'll monitor if many assignments are stuck in PENDING
        const stuckAssignments = await prisma.bookingassignment.count({
            where: {
                status: "PENDING",
                createdAt: { lt: new Date(Date.now() - 30 * 60 * 1000) } // Older than 30 mins
            }
        });
        if (stuckAssignments > 10) {
            issues.push(`WARNING: ${stuckAssignments} booking assignments may be stuck.`);
        }
    });

    // 6. Send Alerts if issues found
    if (issues.length > 0) {
      await step.run("send-alerts", async () => {
        const adminEmail = process.env.ADMIN_EMAIL || "admin@manaevents.com";
        await sendEmail({
          to: adminEmail,
          subject: "SYSTEM ALERT: Mana Events Platform Issues",
          html: `
            <h1>System Health Alert</h1>
            <p>The following issues were detected during the automated health check:</p>
            <ul>
              ${issues.map(issue => `<li>${issue}</li>`).join("")}
            </ul>
            <p>Please check the <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard">Admin Dashboard</a> for details.</p>
          `
        });
      });
    }

    return { issuesFound: issues.length };
  }
);
