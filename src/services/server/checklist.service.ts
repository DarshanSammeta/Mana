import "server-only";
import { getPrisma } from "@/lib/prisma";

export class ChecklistService {
  /**
   * Initializes the operational checklist for a booking based on its category template.
   */
  static async initializeChecklist(bookingId: string) {
    const prisma = getPrisma();

    // 1. Fetch booking with its category
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
          bookingitem: {
              include: {
                  service: {
                      include: {
                          servicetype: {
                              include: {
                                  subcategory: true
                              }
                          }
                      }
                  }
              }
          }
      }
    });

    if (!booking) return;

    // Use category from the first item
    const categoryId = booking.categoryId || booking.bookingitem[0]?.service.servicetype.subcategory.categoryId;
    if (!categoryId) return;

    // 2. Fetch templates for this category
    const templates = await prisma.checklist_template.findMany({
      where: { categoryId, isActive: true }
    });

    // 3. Clone templates to booking checklists
    if (templates.length > 0) {
      await prisma.booking_checklist.createMany({
        data: templates.map(t => ({
          bookingId,
          title: t.title,
          isCompleted: false
        }))
      });
    }
  }

  /**
   * Updates the completion status of a checklist item.
   */
  static async toggleItem(bookingId: string, itemId: string, isCompleted: boolean, userId: string, userName: string) {
    const prisma = getPrisma();

    return await prisma.$transaction(async (tx) => {
        const item = await tx.booking_checklist.update({
            where: { id: itemId, bookingId },
            data: {
                isCompleted,
                completedBy: isCompleted ? userName : null,
                completedAt: isCompleted ? new Date() : null
            }
        });

        // Log completion to timeline
        if (isCompleted) {
            await tx.booking_timeline.create({
                data: {
                    bookingId,
                    title: "Checklist Updated",
                    description: `Completed: ${item.title}`,
                    performedBy: userName,
                    role: "STAFF",
                    icon: "CheckSquare",
                    color: "emerald"
                }
            });
        }

        return item;
    });
  }

  /**
   * Calculates the overall preparation progress percentage.
   */
  static async getProgress(bookingId: string) {
    const prisma = getPrisma();
    const items = await prisma.booking_checklist.findMany({
      where: { bookingId }
    });

    if (items.length === 0) return 100;

    const completed = items.filter(i => i.isCompleted).length;
    return Math.round((completed / items.length) * 100);
  }
}
