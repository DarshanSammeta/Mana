import { prisma } from "./prisma";

export class AuditTrail {
  /**
   * Logs a critical system or business event
   */
  static async log(userId: string, action: string, details: any, ipAddress: string) {
    return await prisma.auditlog.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        action,
        details: details || {},
        ipAddress,
        createdAt: new Date()
      }
    });
  }

  /**
   * Fetches audit trail for a specific entity (booking, user, etc)
   */
  static async getEntityTrail(entityType: string, entityId: string) {
    // Assuming entityId is stored in the details JSON field
    return await prisma.auditlog.findMany({
      where: {
        details: {
          path: [entityType],
          equals: entityId
        } as any
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
