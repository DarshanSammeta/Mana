import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
import { sendVendorVerificationUpdateEmail } from "@/lib/mail/resend";

interface VendorNotificationParams {
  userId: string;
  title: string;
  message: string;
  link?: string;
  metadata?: any;
  emailData?: {
    status: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUIRED';
    rejectionReason?: string;
  };
}

export async function sendVendorNotification({
  userId,
  title,
  message,
  link,
  metadata,
  emailData
}: VendorNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        title,
        message,
        category: "SYSTEM",
        priority: "HIGH",
        link,
        metadata,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true, notification_preference: true }
    });

    if (user?.email && emailData) {
      // Check if user has opted out of emails (assuming default is true if preference is null)
      const preferences = user.notification_preference as any;
      if (preferences?.email !== false) {
        await sendVendorVerificationUpdateEmail(user.email, {
          vendorName: user.fullName || "Vendor",
          status: emailData.status,
          message: message,
          rejectionReason: emailData.rejectionReason
        });
      }
    }

    return notification;
  } catch (error) {
    logger.error("Failed to send vendor notification", { error, userId, title });
    throw error;
  }
}

export const VendorNotifications = {
  profileSubmitted: (userId: string) =>
    sendVendorNotification({
      userId,
      title: "Profile Submitted",
      message: "Your business profile has been successfully submitted and is awaiting review.",
      link: "/vendor/dashboard"
    }),

  verificationStarted: (userId: string) =>
    sendVendorNotification({
      userId,
      title: "Verification Started",
      message: "An admin has started reviewing your verification documents.",
      link: "/vendor/dashboard"
    }),

  approved: (userId: string) =>
    sendVendorNotification({
      userId,
      title: "Account Approved! 🚀",
      message: "Congratulations! Your vendor account has been verified. You can now start receiving bookings.",
      link: "/vendor/dashboard",
      emailData: { status: 'APPROVED' }
    }),

  rejected: (userId: string, reason: string) =>
    sendVendorNotification({
      userId,
      title: "Verification Rejected",
      message: `Unfortunately, your verification was not successful. Reason: ${reason}`,
      link: "/vendor/dashboard",
      metadata: { reason },
      emailData: { status: 'REJECTED', rejectionReason: reason }
    }),

  changesRequested: (userId: string, comment: string) =>
    sendVendorNotification({
      userId,
      title: "Changes Required",
      message: `Action Required: Please update your profile as per admin feedback: ${comment}`,
      link: "/vendor/dashboard",
      metadata: { comment },
      emailData: { status: 'CHANGES_REQUIRED', rejectionReason: comment }
    })
};
