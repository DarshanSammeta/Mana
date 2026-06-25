import { prisma } from "./prisma";

export async function createAuditLog({
  userId,
  action,
  details,
  ipAddress,
}: {
  userId?: string;
  action: string;
  details?: any;
  ipAddress?: string;
}) {
  try {
    await prisma.auditlog.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        action,
        details: details ? JSON.parse(JSON.stringify(details)) : undefined,
        ipAddress,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}
