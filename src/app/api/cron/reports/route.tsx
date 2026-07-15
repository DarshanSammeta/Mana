import { APP_CONFIG } from "@/config/app";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getResend } from "@/lib/resend";
import { getReportData, generatePDFBuffer, generateExcelBuffer, ReportType } from "@/lib/reports/reportGenerator";
import { AutomatedReportEmail } from "@/components/emails/AutomatedReportEmail";

export async function GET(req: Request) {
  const resend = getResend();
  if (!resend) {
    console.error("Resend service is unavailable for cron reports");
    return NextResponse.json({ error: "Resend service is unavailable" }, { status: 500 });
  }
  // Check for CRON_SECRET to protect the endpoint
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${APP_CONFIG.cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const now = new Date();

    // 1. Find all active schedules that are due
    const schedules = await prisma.reportschedule.findMany({
      where: {
        isActive: true,
        OR: [
          { nextRun: { lte: now } },
          { nextRun: null }
        ],
        vendorprofile: {
          vendorsubscription: {
            status: "ACTIVE",
            subscriptionplan: {
              rank: { gte: 2 } // Elite/Gold members (rank 2+)
            }
          }
        }
      },
      include: {
        vendorprofile: {
          include: {
            user: { select: { email: true } },
            vendorsubscription: { include: { subscriptionplan: true } }
          }
        }
      }
    });

    const results = [];

    for (const schedule of schedules) {
      try {
        const vendorId = schedule.vendorProfileId;
        const recipientEmail = schedule.recipientEmail || schedule.vendorprofile.user.email;
        const reportTypes = schedule.reportTypes as ReportType[];

        // Calculate date range (previous month or week based on frequency)
        const endDate = new Date();
        const startDate = new Date();
        if (schedule.frequency === "MONTHLY") {
          startDate.setMonth(startDate.getMonth() - 1);
        } else {
          startDate.setDate(startDate.getDate() - 7);
        }

        const attachments: any[] = [];

        // Generate reports
        for (const type of reportTypes) {
          const { data, businessName } = await getReportData(vendorId, type, startDate, endDate);

          if (schedule.format === "PDF" || schedule.format === "BOTH") {
            const pdfBuffer = await generatePDFBuffer(`${type.toUpperCase()} Report`, data, businessName);
            attachments.push({
              filename: `${type}_report_${startDate.toISOString().split('T')[0]}.pdf`,
              content: pdfBuffer,
            });
          }

          if (schedule.format === "EXCEL" || schedule.format === "BOTH") {
            const excelBuffer = await generateExcelBuffer(data);
            attachments.push({
              filename: `${type}_report_${startDate.toISOString().split('T')[0]}.xlsx`,
              content: excelBuffer,
            });
          }
        }

        // Send Email
        if (attachments.length > 0) {
          await resend.emails.send({
            from: "Mana Events Reports <reports@manaevents.in>",
            to: recipientEmail,
            subject: `Automated Business Report - ${schedule.vendorprofile.businessName}`,
            react: (
              <AutomatedReportEmail
                businessName={schedule.vendorprofile.businessName}
                reportFrequency={schedule.frequency}
                startDate={startDate.toLocaleDateString()}
                endDate={endDate.toLocaleDateString()}
              />
            ),
            attachments: attachments,
          });
        }

        // Update schedule
        const nextRun = new Date();
        if (schedule.frequency === "MONTHLY") {
          nextRun.setMonth(nextRun.getMonth() + 1);
        } else {
          nextRun.setDate(nextRun.getDate() + 7);
        }

        await prisma.reportschedule.update({
          where: { id: schedule.id },
          data: {
            lastRun: now,
            nextRun: nextRun,
          }
        });

        results.push({ vendor: schedule.vendorprofile.businessName, status: "SUCCESS" });
      } catch (err) {
        console.error(`Error processing report for ${schedule.vendorprofile.businessName}:`, err);
        results.push({ vendor: schedule.vendorprofile.businessName, status: "FAILED", error: (err as Error).message });
      }
    }

    return NextResponse.json({ processed: results.length, details: results });
  } catch (error) {
    console.error("Cron Job Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
