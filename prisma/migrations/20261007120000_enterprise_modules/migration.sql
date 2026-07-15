-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "wallet_type" ADD VALUE 'ESCROW';
ALTER TYPE "wallet_type" ADD VALUE 'COMMISSION';
ALTER TYPE "wallet_type" ADD VALUE 'REFUND';

-- AlterTable
ALTER TABLE "coupon" ADD COLUMN     "campaignId" TEXT,
ADD COLUMN     "categoryRestrict" TEXT,
ADD COLUMN     "isFirstBooking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxDiscount" DECIMAL(10,2),
ADD COLUMN     "stackable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "usageLimit" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "usedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "vendorRestrict" TEXT;

-- AlterTable
ALTER TABLE "invoice" ADD COLUMN     "gstDetails" JSONB,
ADD COLUMN     "subTotal" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'BOOKING';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "interests" JSONB,
ADD COLUMN     "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referralCode" TEXT;

-- AlterTable
ALTER TABLE "vendorprofile" ADD COLUMN     "cancellationPolicy" TEXT,
ADD COLUMN     "experienceYears" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "recently_viewed" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "serviceId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recently_viewed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_search" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "filters" JSONB NOT NULL,
    "query" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_search_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rewardPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_rule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetId" TEXT,
    "rate" DECIMAL(5,2) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_config" (
    "id" TEXT NOT NULL,
    "hsnCode" TEXT NOT NULL,
    "description" TEXT,
    "gstRate" DECIMAL(5,2) NOT NULL,
    "cgstRate" DECIMAL(5,2) NOT NULL,
    "sgstRate" DECIMAL(5,2) NOT NULL,
    "igstRate" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlement" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "payoutId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "taxDeducted" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "commissionCharged" DECIMAL(10,2) NOT NULL,
    "netAmount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "reference" TEXT,
    "bankDetails" JSONB,
    "auditLog" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_detection_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "vendorId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'LOW',
    "description" TEXT NOT NULL,
    "evidence" JSONB,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fraud_detection_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_ticket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assignedTo" TEXT,
    "slaDeadline" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_ticket_message" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" JSONB,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_ticket_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_metrics" (
    "id" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "nps" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "responseTime" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quality_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cancellation_record" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "cancelledBy" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "penaltyAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "refundAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cancellation_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "budget" DECIMAL(10,2),
    "spent" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "targetSegmentId" TEXT,
    "city" TEXT,
    "categoryIds" JSONB,
    "vendorIds" JSONB,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "image" TEXT,
    "link" TEXT,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_segment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filters" JSONB NOT NULL,
    "userCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_segment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_analytics" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "source" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_crm_data" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lifecycleStage" TEXT NOT NULL DEFAULT 'REGISTERED',
    "bookingFrequency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lifetimeValue" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "preferredCategories" JSONB,
    "preferredVendors" JSONB,
    "averageSpend" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "lastBookingDate" TIMESTAMP(3),
    "retentionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "churnRisk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_crm_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_crm_data" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "growthRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rankingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenueYTD" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "marketShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "competitorRank" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_crm_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo_metadata" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "keywords" TEXT,
    "ogImage" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "canonicalUrl" TEXT,
    "schemaMarkup" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_fraud_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" JSONB,
    "severity" TEXT NOT NULL DEFAULT 'LOW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_fraud_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_workspace" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT,
    "eventDate" TIMESTAMP(3),
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "budget" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_collaborator" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),

    CONSTRAINT "event_collaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_checklist_item" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "assignedTo" TEXT,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_checklist_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_guest" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "group" TEXT,
    "isVip" BOOLEAN NOT NULL DEFAULT false,
    "rsvpStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "mealPreference" TEXT,
    "tableNumber" TEXT,
    "invitationStatus" TEXT NOT NULL DEFAULT 'NOT_SENT',
    "attendanceStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_budget_item" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "estimatedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "actualAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "vendorId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_budget_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_timeline_item" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "type" TEXT NOT NULL DEFAULT 'PLANNING',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "location" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_timeline_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_note" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_file" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "folder" TEXT,
    "tags" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_invitation" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EMAIL',
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "qrCode" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "event_invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_emergency_contact" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "isBackupVendor" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "event_emergency_contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_incident_report" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'LOW',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "event_incident_report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recently_viewed_userId_idx" ON "recently_viewed"("userId");

-- CreateIndex
CREATE INDEX "recently_viewed_timestamp_idx" ON "recently_viewed"("timestamp");

-- CreateIndex
CREATE INDEX "saved_search_userId_idx" ON "saved_search"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "referral_referredId_key" ON "referral"("referredId");

-- CreateIndex
CREATE INDEX "loyalty_transaction_userId_idx" ON "loyalty_transaction"("userId");

-- CreateIndex
CREATE INDEX "commission_rule_type_targetId_idx" ON "commission_rule"("type", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "tax_config_hsnCode_key" ON "tax_config"("hsnCode");

-- CreateIndex
CREATE UNIQUE INDEX "settlement_payoutId_key" ON "settlement"("payoutId");

-- CreateIndex
CREATE UNIQUE INDEX "settlement_reference_key" ON "settlement"("reference");

-- CreateIndex
CREATE INDEX "settlement_vendorId_idx" ON "settlement"("vendorId");

-- CreateIndex
CREATE INDEX "settlement_status_idx" ON "settlement"("status");

-- CreateIndex
CREATE INDEX "fraud_detection_log_type_idx" ON "fraud_detection_log"("type");

-- CreateIndex
CREATE INDEX "fraud_detection_log_severity_idx" ON "fraud_detection_log"("severity");

-- CreateIndex
CREATE INDEX "support_ticket_userId_idx" ON "support_ticket"("userId");

-- CreateIndex
CREATE INDEX "support_ticket_status_idx" ON "support_ticket"("status");

-- CreateIndex
CREATE INDEX "support_ticket_category_idx" ON "support_ticket"("category");

-- CreateIndex
CREATE UNIQUE INDEX "quality_metrics_targetId_key" ON "quality_metrics"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "cancellation_record_bookingId_key" ON "cancellation_record"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_segment_name_key" ON "customer_segment"("name");

-- CreateIndex
CREATE INDEX "marketing_analytics_campaignId_idx" ON "marketing_analytics"("campaignId");

-- CreateIndex
CREATE INDEX "marketing_analytics_userId_idx" ON "marketing_analytics"("userId");

-- CreateIndex
CREATE INDEX "marketing_analytics_eventType_idx" ON "marketing_analytics"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "customer_crm_data_userId_key" ON "customer_crm_data"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_crm_data_vendorId_key" ON "vendor_crm_data"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "message_template_name_key" ON "message_template"("name");

-- CreateIndex
CREATE UNIQUE INDEX "seo_metadata_path_key" ON "seo_metadata"("path");

-- CreateIndex
CREATE INDEX "referral_fraud_log_userId_idx" ON "referral_fraud_log"("userId");

-- CreateIndex
CREATE INDEX "event_workspace_userId_idx" ON "event_workspace"("userId");

-- CreateIndex
CREATE INDEX "event_workspace_status_idx" ON "event_workspace"("status");

-- CreateIndex
CREATE UNIQUE INDEX "event_collaborator_workspaceId_email_key" ON "event_collaborator"("workspaceId", "email");

-- CreateIndex
CREATE INDEX "event_checklist_item_workspaceId_idx" ON "event_checklist_item"("workspaceId");

-- CreateIndex
CREATE INDEX "event_checklist_item_status_idx" ON "event_checklist_item"("status");

-- CreateIndex
CREATE INDEX "event_guest_workspaceId_idx" ON "event_guest"("workspaceId");

-- CreateIndex
CREATE INDEX "event_guest_rsvpStatus_idx" ON "event_guest"("rsvpStatus");

-- CreateIndex
CREATE INDEX "event_budget_item_workspaceId_idx" ON "event_budget_item"("workspaceId");

-- CreateIndex
CREATE INDEX "event_timeline_item_workspaceId_idx" ON "event_timeline_item"("workspaceId");

-- CreateIndex
CREATE INDEX "event_timeline_item_startTime_idx" ON "event_timeline_item"("startTime");

-- CreateIndex
CREATE INDEX "event_note_workspaceId_idx" ON "event_note"("workspaceId");

-- CreateIndex
CREATE INDEX "event_file_workspaceId_idx" ON "event_file"("workspaceId");

-- CreateIndex
CREATE INDEX "event_invitation_workspaceId_idx" ON "event_invitation"("workspaceId");

-- CreateIndex
CREATE INDEX "event_invitation_guestId_idx" ON "event_invitation"("guestId");

-- CreateIndex
CREATE INDEX "event_emergency_contact_workspaceId_idx" ON "event_emergency_contact"("workspaceId");

-- CreateIndex
CREATE INDEX "event_incident_report_workspaceId_idx" ON "event_incident_report"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "user_referralCode_key" ON "user"("referralCode");

-- AddForeignKey
ALTER TABLE "coupon" ADD CONSTRAINT "coupon_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendorprofile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_search" ADD CONSTRAINT "saved_search_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral" ADD CONSTRAINT "referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral" ADD CONSTRAINT "referral_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transaction" ADD CONSTRAINT "loyalty_transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement" ADD CONSTRAINT "settlement_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement" ADD CONSTRAINT "settlement_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_detection_log" ADD CONSTRAINT "fraud_detection_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_detection_log" ADD CONSTRAINT "fraud_detection_log_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendorprofile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_ticket_message" ADD CONSTRAINT "support_ticket_message_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_ticket_message" ADD CONSTRAINT "support_ticket_message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancellation_record" ADD CONSTRAINT "cancellation_record_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaign" ADD CONSTRAINT "marketing_campaign_targetSegmentId_fkey" FOREIGN KEY ("targetSegmentId") REFERENCES "customer_segment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_analytics" ADD CONSTRAINT "marketing_analytics_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_analytics" ADD CONSTRAINT "marketing_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_crm_data" ADD CONSTRAINT "customer_crm_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_crm_data" ADD CONSTRAINT "vendor_crm_data_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendorprofile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_fraud_log" ADD CONSTRAINT "referral_fraud_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_workspace" ADD CONSTRAINT "event_workspace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_collaborator" ADD CONSTRAINT "event_collaborator_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "event_workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_collaborator" ADD CONSTRAINT "event_collaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_checklist_item" ADD CONSTRAINT "event_checklist_item_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "event_workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_checklist_item" ADD CONSTRAINT "event_checklist_item_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_guest" ADD CONSTRAINT "event_guest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "event_workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_budget_item" ADD CONSTRAINT "event_budget_item_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "event_workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_timeline_item" ADD CONSTRAINT "event_timeline_item_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "event_workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_note" ADD CONSTRAINT "event_note_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "event_workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_note" ADD CONSTRAINT "event_note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_file" ADD CONSTRAINT "event_file_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "event_workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_file" ADD CONSTRAINT "event_file_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_invitation" ADD CONSTRAINT "event_invitation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "event_workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_invitation" ADD CONSTRAINT "event_invitation_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "event_guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_emergency_contact" ADD CONSTRAINT "event_emergency_contact_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "event_workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_incident_report" ADD CONSTRAINT "event_incident_report_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "event_workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
