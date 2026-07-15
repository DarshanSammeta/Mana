import { inngest } from '@/lib/inngest';
import { PrismaClient } from '@prisma/client';
import { getResend } from '@/lib/resend';

const prisma = new PrismaClient();

/**
 * Daily Event Planning Summary
 */
export const sendDailyPlanningSummary = inngest.createFunction(
  { id: 'daily-planning-summary', triggers: [{ cron: '0 8 * * *' }] },
  async ({ step }) => {
    const activeWorkspaces = await step.run('fetch-active-workspaces', async () => {
      const data = await prisma.event_workspace.findMany({
        where: { status: 'PLANNING' },
        include: {
          user: { select: { email: true, fullName: true } },
          checklist_items: { where: { status: 'PENDING', dueDate: { lte: new Date(Date.now() + 86400000) } } },
          budget_items: true,
        }
      });
      return data;
    });

    for (const workspace of (activeWorkspaces as any[])) {
      await step.run(`send-summary-${workspace.id}`, async () => {
        if (workspace.checklist_items.length > 0) {
          const resend = getResend();
          if (resend) {
            // Send email logic
            console.log(`Sending daily summary to ${workspace.user.email} for event ${workspace.title}`);
          }
        }
      });
    }
  }
);

/**
 * RSVP Reminders for Guests
 */
export const sendRSVPReminders = inngest.createFunction(
  { id: 'rsvp-reminders', triggers: [{ event: 'event/rsvp.reminder' }] },
  async ({ event, step }) => {
    const { workspaceId } = event.data;

    const pendingGuests = await step.run('fetch-pending-guests', async () => {
      const data = await prisma.event_guest.findMany({
        where: { workspaceId, rsvpStatus: 'PENDING', email: { not: null } },
      });
      return data;
    });

    for (const guest of (pendingGuests as any[])) {
      await step.run(`send-rsvp-email-${guest.id}`, async () => {
        // Send email with RSVP link
        console.log(`Sending RSVP reminder to ${guest.email}`);
      });
    }
  }
);

/**
 * Budget Alert Job
 */
export const budgetThresholdAlert = inngest.createFunction(
  { id: 'budget-threshold-alert', triggers: [{ event: 'event/budget.updated' }] },
  async ({ event, step }) => {
    const { workspaceId } = event.data;

    const workspaceData = await step.run('check-budget', async () => {
      const ws = await prisma.event_workspace.findUnique({
        where: { id: workspaceId },
        include: { budget_items: true, user: true }
      });

      const totalActual = ws?.budget_items.reduce((acc, i) => acc + Number(i.actualAmount), 0) || 0;
      return {
        overBudget: totalActual > Number(ws?.budget || 0),
        userEmail: ws?.user.email,
        total: totalActual,
        planned: ws?.budget
      };
    });

    const workspace = workspaceData as { overBudget: boolean, userEmail: string | undefined, total: number, planned: any };

    if (workspace.overBudget) {
      await step.run('send-budget-alert', async () => {
        // Send alert
        console.log(`Budget Alert: ${workspace.userEmail} is over budget!`);
      });
    }
  }
);
