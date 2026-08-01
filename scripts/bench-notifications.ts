import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function bench() {
  const userId = "test-user-id"; // Adjust to a real ID if available

  console.log("--- NOTIFICATIONS BENCHMARK (Simulated) ---");

  const start = performance.now();

  // Optimized parallel query
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      select: { id: true, title: true, isRead: true, createdAt: true },
      take: 20,
      orderBy: { createdAt: "desc" }
    }),
    prisma.notification.count({
      where: { userId, isRead: false }
    })
  ]);

  const end = performance.now();
  console.log(`Duration: ${(end - start).toFixed(2)}ms`);
  console.log(`Found: ${notifications.length} notifications, ${unreadCount} unread`);

  if (end - start < 150) {
    console.log("✅ Performance Target MET (<150ms)");
  } else {
    console.log("⚠️ Performance Target NOT MET");
  }
}

bench().then(() => prisma.$disconnect());
