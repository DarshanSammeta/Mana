import "server-only";
import { getPrisma } from '@/lib/prisma';
import { safeRedis } from '@/lib/redis';
import { getResend } from '@/lib/resend';

if (typeof window !== "undefined") {
  throw new Error("EventPlanningService can only be used on the server.");
}

export class EventPlanningService {
  /**
   * Event Workspace Management
   */
  static async createWorkspace(userId: string, data: any) {
    const prisma = getPrisma();
    const workspace = await prisma.event_workspace.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        eventType: data.eventType,
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
        location: data.location,
        budget: data.budget || 0,
        collaborators: {
          create: {
            email: data.userEmail,
            userId,
            role: 'OWNER',
            status: 'ACTIVE',
            joinedAt: new Date(),
          },
        },
      },
      include: {
        collaborators: true,
      },
    });

    // Auto-generate checklist based on event type
    if (data.eventType) {
      await this.generateDefaultChecklist(workspace.id, data.eventType);
    }

    return workspace;
  }

  static async getWorkspace(workspaceId: string, userId: string) {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const workspace = await prisma.event_workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { userId },
          { collaborators: { some: { email: user.email } } }
        ]
      },
      include: {
        collaborators: true,
        checklist_items: { orderBy: { dueDate: 'asc' } },
        guests: true,
        budget_items: true,
        timeline_items: { orderBy: { startTime: 'asc' } },
        notes: { include: { author: { select: { fullName: true, profileImage: true } } }, orderBy: { createdAt: 'desc' } },
        files: true,
        emergency_contacts: true,
        incident_reports: true,
      },
    });

    return workspace;
  }

  /**
   * Checklist Management
   */
  private static async generateDefaultChecklist(workspaceId: string, eventType: string) {
    const prisma = getPrisma();
    const templates: Record<string, any[]> = {
      'Wedding': [
        { title: 'Book Venue', category: 'Venue', priority: 'HIGH' },
        { title: 'Hire Catering', category: 'Catering', priority: 'HIGH' },
        { title: 'Select Decorator', category: 'Decoration', priority: 'MEDIUM' },
        { title: 'Book Photographer', category: 'Photography', priority: 'MEDIUM' },
        { title: 'Finalize Guest List', category: 'Guests', priority: 'HIGH' },
        { title: 'Send Invitations', category: 'Invitations', priority: 'MEDIUM' },
      ],
      'Birthday': [
        { title: 'Order Cake', category: 'Catering', priority: 'HIGH' },
        { title: 'Select Theme', category: 'Decoration', priority: 'MEDIUM' },
        { title: 'Plan Games', category: 'Entertainment', priority: 'LOW' },
      ]
    };

    const items = templates[eventType] || [];
    if (items.length > 0) {
      await prisma.event_checklist_item.createMany({
        data: items.map(item => ({
          workspaceId,
          ...item,
        })),
      });
    }
  }

  static async updateChecklistStatus(itemId: string, status: string) {
    const prisma = getPrisma();
    return await prisma.event_checklist_item.update({
      where: { id: itemId },
      data: { status },
    });
  }

  /**
   * Guest Management
   */
  static async addGuest(workspaceId: string, data: any) {
    const prisma = getPrisma();
    return await prisma.event_guest.create({
      data: {
        workspaceId,
        ...data,
      },
    });
  }

  static async bulkImportGuests(workspaceId: string, guests: any[]) {
    const prisma = getPrisma();
    return await prisma.event_guest.createMany({
      data: guests.map(g => ({ ...g, workspaceId })),
    });
  }

  /**
   * Budget Planner
   */
  static async addBudgetItem(workspaceId: string, data: any) {
    const prisma = getPrisma();
    return await prisma.event_budget_item.create({
      data: {
        workspaceId,
        ...data,
      },
    });
  }

  static async getBudgetSummary(workspaceId: string) {
    const prisma = getPrisma();
    const items = await prisma.event_budget_item.findMany({
      where: { workspaceId },
    });

    const totalEstimated = items.reduce((acc, item) => acc + Number(item.estimatedAmount), 0);
    const totalActual = items.reduce((acc, item) => acc + Number(item.actualAmount), 0);
    const totalPaid = items.reduce((acc, item) => acc + Number(item.paidAmount), 0);

    return {
      totalEstimated,
      totalActual,
      totalPaid,
      remaining: totalActual - totalPaid,
      items,
    };
  }

  /**
   * Collaboration
   */
  static async inviteCollaborator(workspaceId: string, email: string, role: string) {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { email } });

    const collaborator = await prisma.event_collaborator.create({
      data: {
        workspaceId,
        email,
        role,
        userId: user?.id,
      },
    });

    const resend = getResend();
    if (resend) {
      // Logic to send Email
    }
    return collaborator;
  }

  /**
   * File Management
   */
  static async uploadFile(workspaceId: string, userId: string, data: any) {
    const prisma = getPrisma();
    return await prisma.event_file.create({
      data: {
        workspaceId,
        userId,
        ...data,
      },
    });
  }

  /**
   * Invitation Management
   */
  static async sendInvitation(workspaceId: string, guestId: string, type: string) {
    const prisma = getPrisma();
    const guest = await prisma.event_guest.findUnique({ where: { id: guestId } });
    if (!guest) throw new Error('Guest not found');

    const invitation = await prisma.event_invitation.create({
      data: {
        workspaceId,
        guestId,
        type,
        status: 'SENT',
      },
    });

    // Logic to send Email/SMS/WhatsApp via external providers
    return invitation;
  }

  /**
   * Emergency Center
   */
  static async addEmergencyContact(workspaceId: string, data: any) {
    const prisma = getPrisma();
    return await prisma.event_emergency_contact.create({
      data: {
        workspaceId,
        ...data,
      },
    });
  }

  static async reportIncident(workspaceId: string, data: any) {
    const prisma = getPrisma();
    return await prisma.event_incident_report.create({
      data: {
        workspaceId,
        ...data,
      },
    });
  }

  /**
   * Collaboration Real-time Sync
   */
  static async notifyCollaborators(workspaceId: string, event: string, data: any) {
    await safeRedis.set(`workspace:${workspaceId}`, JSON.stringify({ event, data }));
  }

  /**
   * AI Planning Assistant
   */
  static async getAISuggestions(workspaceId: string) {
    const prisma = getPrisma();
    const workspace = await prisma.event_workspace.findUnique({
      where: { id: workspaceId },
      include: {
        checklist_items: true,
        budget_items: true,
        guests: true,
      },
    });

    if (!workspace) return null;

    const suggestions = [];

    // Check for missing vendor categories based on event type
    if (workspace.eventType === 'Wedding') {
      const categories = workspace.checklist_items.map(i => i.category);
      if (!categories.includes('Photography')) {
        suggestions.push({
          type: 'MISSING_VENDOR',
          message: "It looks like you haven't added a photographer to your checklist yet.",
          recommendation: 'Browse top photographers in your area.'
        });
      }
    }

    // Budget Alerts
    const totalActual = workspace.budget_items.reduce((acc, item) => acc + Number(item.actualAmount), 0);
    if (totalActual > Number(workspace.budget)) {
      suggestions.push({
        type: 'BUDGET_OVERFLOW',
        message: `Your actual spending (${totalActual}) has exceeded your planned budget (${workspace.budget}).`,
        recommendation: 'Consider optimizing decoration or catering costs.'
      });
    }

    return suggestions;
  }

  /**
   * Analytics
   */
  static async getPlanningAnalytics(workspaceId: string) {
    const prisma = getPrisma();
    const [checklist, guests, budget, timeline] = await Promise.all([
      prisma.event_checklist_item.findMany({ where: { workspaceId } }),
      prisma.event_guest.findMany({ where: { workspaceId } }),
      prisma.event_budget_item.findMany({ where: { workspaceId } }),
      prisma.event_timeline_item.findMany({ where: { workspaceId } }),
    ]);

    const checklistProgress = checklist.length > 0
      ? (checklist.filter(i => i.status === 'COMPLETED').length / checklist.length) * 100
      : 0;

    const rsvpRate = guests.length > 0
      ? (guests.filter(g => g.rsvpStatus === 'CONFIRMED').length / guests.length) * 100
      : 0;

    return {
      checklistProgress,
      rsvpRate,
      guestCount: guests.length,
      confirmedGuests: guests.filter(g => g.rsvpStatus === 'CONFIRMED').length,
      totalBudget: budget.reduce((acc, i) => acc + Number(i.actualAmount), 0),
      timelineProgress: timeline.length > 0
        ? (timeline.filter(t => t.status === 'COMPLETED').length / timeline.length) * 100
        : 0,
    };
  }
}
