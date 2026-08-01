-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('DRAFT', 'RESERVED', 'PAYMENT_PENDING', 'PAYMENT_SUCCESS', 'PROCESSING', 'PARTIALLY_CONFIRMED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "reservation_status" AS ENUM ('ACTIVE', 'EXPIRED', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "wallet_type" AS ENUM ('USER', 'VENDOR', 'PLATFORM', 'ESCROW', 'COMMISSION', 'REFUND');

-- CreateEnum
CREATE TYPE "notification_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "notification_category" AS ENUM ('BOOKING', 'PAYMENT', 'CHAT', 'SYSTEM', 'REVIEW', 'MARKETING');

-- CreateEnum
CREATE TYPE "review_moderationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "bookingstatuslog_status" AS ENUM ('DRAFT', 'PENDING', 'VENDORS_NOTIFIED', 'QUOTE_RECEIVED', 'NEGOTIATING', 'QUOTE_ACCEPTED', 'PAYMENT_PENDING', 'REJECTED', 'CONFIRMED', 'CANCELLED', 'PREPARATION', 'VENDOR_ASSIGNED', 'VENDOR_TRAVELING', 'VENDOR_ARRIVED', 'OTP_VERIFICATION_PENDING', 'EVENT_STARTED', 'EVENT_ONGOING', 'EVENT_COMPLETED', 'CUSTOMER_CONFIRMED', 'PAYMENT_RELEASED', 'CLOSED', 'SEARCHING', 'DISPUTED', 'IN_PROGRESS', 'EMERGENCY', 'PENDING_ADVANCE', 'ADVANCE_PAID', 'BALANCE_PENDING', 'FULLY_PAID', 'VENDOR_REVIEW', 'PREPARATION_STARTED', 'VENDOR_EN_ROUTE', 'ARCHIVED', 'REFUND_PENDING', 'REFUND_COMPLETED', 'EXPIRED', 'PENDING_VENDOR_RESPONSE', 'COUNTERED', 'ADVANCE_PAYMENT_PENDING', 'COUNTER_REJECTED', 'PAYMENT_EXPIRED', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "bookingassignment_status" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'REASSIGNED');

-- CreateEnum
CREATE TYPE "payout_status" AS ENUM ('PENDING', 'PROCESSING', 'RELEASED', 'FAILED');

-- CreateEnum
CREATE TYPE "booking_status" AS ENUM ('DRAFT', 'PENDING', 'VENDORS_NOTIFIED', 'QUOTE_RECEIVED', 'NEGOTIATING', 'QUOTE_ACCEPTED', 'PAYMENT_PENDING', 'REJECTED', 'CONFIRMED', 'CANCELLED', 'PREPARATION', 'VENDOR_ASSIGNED', 'VENDOR_TRAVELING', 'VENDOR_ARRIVED', 'OTP_VERIFICATION_PENDING', 'EVENT_STARTED', 'EVENT_ONGOING', 'EVENT_COMPLETED', 'CUSTOMER_CONFIRMED', 'PAYMENT_RELEASED', 'CLOSED', 'SEARCHING', 'DISPUTED', 'IN_PROGRESS', 'EMERGENCY', 'PENDING_ADVANCE', 'ADVANCE_PAID', 'BALANCE_PENDING', 'FULLY_PAID', 'VENDOR_REVIEW', 'PREPARATION_STARTED', 'VENDOR_EN_ROUTE', 'ARCHIVED', 'REFUND_PENDING', 'REFUND_COMPLETED', 'EXPIRED', 'PENDING_VENDOR_RESPONSE', 'COUNTERED', 'ADVANCE_PAYMENT_PENDING', 'COUNTER_REJECTED', 'PAYMENT_EXPIRED', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "refund_status" AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PROCESSED');

-- CreateEnum
CREATE TYPE "transaction_type" AS ENUM ('CREDIT', 'DEBIT', 'COMMISSION', 'REFUND', 'PAYOUT');

-- CreateEnum
CREATE TYPE "vendordocument_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "transaction_status" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('CUSTOMER', 'VENDOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "dispute_status" AS ENUM ('OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "vendorprofile_verificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUIRED', 'SUSPENDED', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "vendorsubscription_status" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "subscriptionpayment_status" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "activitylog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activitylog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditlog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditlog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT,
    "endTime" TEXT,
    "bookingLimit" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "peakPriceModifier" DECIMAL(5,2),

    CONSTRAINT "availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking" (
    "id" TEXT NOT NULL,
    "bookingNumber" TEXT NOT NULL,
    "vendorId" TEXT,
    "status" "booking_status" NOT NULL DEFAULT 'PENDING',
    "eventName" TEXT,
    "eventType" TEXT,
    "eventDescription" TEXT,
    "landmark" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "commissionAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "vendorPayout" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "subTotal" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "couponId" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "eventTime" TEXT,
    "eventLocation" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "guestCount" INTEGER NOT NULL,
    "specialInstructions" TEXT,
    "otp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "checklist" JSONB,
    "idempotencyKey" TEXT,
    "vendorConfirmedAt5d" BOOLEAN,
    "advanceAmount" DECIMAL(10,2),
    "advancePaidAt" TIMESTAMP(3),
    "balanceAmount" DECIMAL(10,2),
    "balanceDueDate" TIMESTAMP(3),
    "balancePaidAt" TIMESTAMP(3),
    "paymentStage" TEXT DEFAULT 'PENDING',
    "categoryId" TEXT,
    "eventTypeId" TEXT,
    "packageId" TEXT,
    "serviceTypeId" TEXT,
    "snapshot" JSONB,
    "snapshotVersion" INTEGER NOT NULL DEFAULT 1,
    "subcategoryId" TEXT,
    "customerProfileId" TEXT NOT NULL,
    "currentQuoteId" TEXT,
    "paymentDeadline" TIMESTAMP(3),
    "viewedByVendor" BOOLEAN NOT NULL DEFAULT false,
    "orderId" TEXT,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookingassignment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "status" "bookingassignment_status" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookingassignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookingitem" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "packageId" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "bookingitem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookingstatuslog" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "status" "bookingstatuslog_status" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookingstatuslog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerProfileId" TEXT NOT NULL,

    CONSTRAINT "cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cartitem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "vendorId" TEXT,
    "packageId" TEXT,
    "eventDate" TIMESTAMP(3),
    "eventTime" TEXT,
    "guestCount" INTEGER,
    "location" TEXT,
    "notes" TEXT,
    "addons" JSONB,
    "packagePrice" DECIMAL(10,2),
    "addonPrice" DECIMAL(10,2),
    "gst" DECIMAL(10,2),
    "platformFee" DECIMAL(10,2),
    "discount" DECIMAL(10,2),
    "totalPrice" DECIMAL(10,2),
    "priceSnapshot" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cartitem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventtype" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventtype_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "commissionRate" DECIMAL(5,2),
    "image" TEXT,
    "eventTypeId" TEXT NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversationparticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversationparticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "minBookingAmount" DECIMAL(10,2),
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "campaignId" TEXT,
    "categoryRestrict" TEXT,
    "isFirstBooking" BOOLEAN NOT NULL DEFAULT false,
    "maxDiscount" DECIMAL(10,2),
    "stackable" BOOLEAN NOT NULL DEFAULT false,
    "usageLimit" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "vendorRestrict" TEXT,

    CONSTRAINT "coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recently_viewed" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "serviceId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerProfileId" TEXT NOT NULL,

    CONSTRAINT "recently_viewed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_search" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "filters" JSONB NOT NULL,
    "query" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerProfileId" TEXT NOT NULL,

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
    "points" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerProfileId" TEXT NOT NULL,

    CONSTRAINT "loyalty_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "raisedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB,
    "status" "dispute_status" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventcheckin" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "eventcheckin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "globalsettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "globalsettings_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "invoice" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gstDetails" JSONB,
    "subTotal" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "type" TEXT NOT NULL DEFAULT 'BOOKING',

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locationtrackinglog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locationtrackinglog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookingId" TEXT,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messageattachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messageattachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" "notification_category" NOT NULL DEFAULT 'SYSTEM',
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "priority" "notification_priority" NOT NULL DEFAULT 'MEDIUM',
    "pushSent" BOOLEAN NOT NULL DEFAULT false,
    "smsSent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "notification_category" NOT NULL,
    "email" BOOLEAN NOT NULL DEFAULT true,
    "sms" BOOLEAN NOT NULL DEFAULT false,
    "push" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "inclusions" JSONB,
    "exclusions" JSONB,
    "images" JSONB,
    "videos" JSONB,

    CONSTRAINT "package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "payment_status" NOT NULL DEFAULT 'PENDING',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "method" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paymentType" TEXT DEFAULT 'FULL',
    "orderId" TEXT,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transaction" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "externalTransactionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "method" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "metadata" JSONB,
    "errorDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_split" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "adminShare" DECIMAL(10,2) NOT NULL,
    "vendorShare" DECIMAL(10,2) NOT NULL,
    "commissionRate" DECIMAL(5,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerProfileId" TEXT NOT NULL,

    CONSTRAINT "payment_split_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "payout_status" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "bankDetails" JSONB,
    "notes" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "serviceId" TEXT,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,

    CONSTRAINT "portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricingrule" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "minGuests" INTEGER NOT NULL,
    "maxGuests" INTEGER NOT NULL,
    "pricePerGuest" DECIMAL(10,2) NOT NULL,
    "flatFee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT "pricingrule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refreshtoken" (
    "id" TEXT NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "userId" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refreshtoken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,
    "status" "refund_status" NOT NULL DEFAULT 'REQUESTED',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT,
    "vendorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "images" JSONB,
    "vendorResponse" TEXT,
    "responseAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bookingId" TEXT NOT NULL,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "moderationStatus" "review_moderationStatus" NOT NULL DEFAULT 'PENDING',
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "videoUrl" TEXT,
    "customerProfileId" TEXT NOT NULL,

    CONSTRAINT "review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "serviceTypeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pricingType" TEXT NOT NULL DEFAULT 'PACKAGE',
    "basePrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicetype" (
    "id" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "servicetype_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcategory" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "subcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "bookingId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" "transaction_type" NOT NULL,
    "status" "transaction_status" NOT NULL DEFAULT 'COMPLETED',
    "description" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'CUSTOMER',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "otp" TEXT,
    "otpExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lockUntil" TIMESTAMP(3),
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "deviceId" TEXT,
    "fcmToken" TEXT,
    "lastSeen" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customerprofile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileImage" TEXT,
    "interests" JSONB,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "referralCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customerprofile_pkey" PRIMARY KEY ("id")
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
    "eventType" TEXT NOT NULL,
    "source" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerProfileId" TEXT,

    CONSTRAINT "marketing_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_crm_data" (
    "id" TEXT NOT NULL,
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
    "customerProfileId" TEXT NOT NULL,

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
    "reason" TEXT NOT NULL,
    "evidence" JSONB,
    "severity" TEXT NOT NULL DEFAULT 'LOW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerProfileId" TEXT NOT NULL,

    CONSTRAINT "referral_fraud_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_workspace" (
    "id" TEXT NOT NULL,
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
    "customerProfileId" TEXT NOT NULL,

    CONSTRAINT "event_workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_collaborator" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),
    "customerProfileId" TEXT,

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
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerProfileId" TEXT,

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
    "title" TEXT,
    "content" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerProfileId" TEXT NOT NULL,

    CONSTRAINT "event_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_file" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "folder" TEXT,
    "tags" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerProfileId" TEXT NOT NULL,

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

-- CreateTable
CREATE TABLE "address" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "customLabel" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "fullName" TEXT,
    "mobileNumber" TEXT,
    "street" TEXT,
    "area" TEXT,
    "locality" TEXT,
    "landmark" TEXT,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "pincode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "timezone" TEXT,
    "accuracy" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerProfileId" TEXT NOT NULL,

    CONSTRAINT "address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_analytics" (
    "id" TEXT NOT NULL,
    "query" TEXT,
    "category" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendordocument" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" "vendordocument_status" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendordocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_payout" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "payout_status" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "bankDetails" JSONB,
    "notes" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendorteam" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendorteam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_penalty" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "bookingId" TEXT,
    "type" TEXT NOT NULL,
    "pointsDeducted" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_penalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendorprofile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "coverImage" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "serviceRadius" DOUBLE PRECISION DEFAULT 50,
    "gstNumber" TEXT,
    "bankDetails" JSONB,
    "verificationStatus" "vendorprofile_verificationStatus" NOT NULL DEFAULT 'PENDING',
    "commissionRate" DECIMAL(5,2),
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "responseTime" INTEGER NOT NULL DEFAULT 0,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "searchScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "advanceBookingDays" INTEGER NOT NULL DEFAULT 365,
    "baseTravelCharge" DECIMAL(10,2) DEFAULT 0.00,
    "bufferTime" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "maxTravelDistance" DOUBLE PRECISION DEFAULT 100,
    "minBookingNotice" INTEGER NOT NULL DEFAULT 24,
    "travelChargesPerKm" DECIMAL(10,2) DEFAULT 0.00,
    "vacationEndDate" TIMESTAMP(3),
    "vacationMode" BOOLEAN NOT NULL DEFAULT false,
    "vacationStartDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rejectedDocuments" JSONB,
    "rejectionReason" TEXT,
    "reliabilityScore" INTEGER NOT NULL DEFAULT 100,
    "aadhaarNumber" TEXT,
    "categoryId" TEXT,
    "panNumber" TEXT,
    "cancellationPolicy" TEXT,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "approvedAt" TIMESTAMPTZ(6),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMPTZ(6),
    "rejectedBy" TEXT,
    "reviewedAt" TIMESTAMPTZ(6),
    "suspendedAt" TIMESTAMPTZ(6),
    "suspendedBy" TEXT,
    "suspensionReason" TEXT,

    CONSTRAINT "vendorprofile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurringavailability" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT DEFAULT '09:00',
    "endTime" TEXT DEFAULT '18:00',
    "bookingLimit" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "recurringavailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendorscore" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "ratingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "distanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendorscore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "pendingBalance" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "withdrawable" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "lifetimeEarnings" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "lifetimeSpending" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "type" "wallet_type" NOT NULL DEFAULT 'USER',

    CONSTRAINT "wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhookevent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhookevent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerProfileId" TEXT NOT NULL,

    CONSTRAINT "wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlistitem" (
    "id" TEXT NOT NULL,
    "wishlistId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlistitem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerProfileId" TEXT NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'DRAFT',
    "idempotencyKey" TEXT,
    "packageAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "addonAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "gstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "advanceAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "balanceAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "couponId" TEXT,
    "financialSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "eventTime" TEXT,
    "guestCount" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "notes" TEXT,
    "addons" JSONB,
    "packageAmount" DECIMAL(10,2) NOT NULL,
    "addonAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "gstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "priceSnapshot" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "orderId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "reservation_status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passwordresettoken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "passwordresettoken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptionpayment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "razorpaySignature" TEXT,
    "status" "subscriptionpayment_status" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptionpayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptionplan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "durationMonths" INTEGER NOT NULL DEFAULT 1,
    "listingLimit" INTEGER NOT NULL DEFAULT 3,
    "features" JSONB NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptionplan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendorsubscription" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "vendorsubscription_status" NOT NULL DEFAULT 'ACTIVE',
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendorsubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reportschedule" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "format" TEXT NOT NULL DEFAULT 'PDF',
    "recipientEmail" TEXT,
    "reportTypes" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRun" TIMESTAMP(3),
    "nextRun" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reportschedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "category" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_timeline" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "performedBy" TEXT,
    "role" TEXT,
    "metadata" JSONB,
    "icon" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_team" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_team_member" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "avatar" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_team_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_team_assignment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "roleAtEvent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_team_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_template" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_checklist" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_document" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "snapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "bookingId" TEXT,
    "vendorId" TEXT,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedByUserId" TEXT,
    "performedByRole" TEXT,
    "performedByName" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "metadata" JSONB,
    "requestId" TEXT,
    "correlationId" TEXT,
    "ipAddress" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "operatingSystem" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerProfileId" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund_policy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "daysBefore" INTEGER NOT NULL,
    "refundPercentage" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refund_policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund_request" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refund_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_addon" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_addon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_addon" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "addonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "booking_addon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counterquote" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "previousQuoteId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counterquote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "activitylog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "auditlog"("userId");

-- CreateIndex
CREATE INDEX "Availability_vendorProfileId_idx" ON "availability"("vendorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingNumber_key" ON "booking"("bookingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "booking_idempotencyKey_key" ON "booking"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Booking_couponId_idx" ON "booking"("couponId");

-- CreateIndex
CREATE INDEX "Booking_customerProfileId_idx" ON "booking"("customerProfileId");

-- CreateIndex
CREATE INDEX "Booking_vendorId_idx" ON "booking"("vendorId");

-- CreateIndex
CREATE INDEX "booking_customerProfileId_status_createdAt_idx" ON "booking"("customerProfileId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "booking_status_idx" ON "booking"("status");

-- CreateIndex
CREATE INDEX "booking_eventDate_idx" ON "booking"("eventDate");

-- CreateIndex
CREATE INDEX "booking_createdAt_idx" ON "booking"("createdAt");

-- CreateIndex
CREATE INDEX "booking_eventTypeId_idx" ON "booking"("eventTypeId");

-- CreateIndex
CREATE INDEX "booking_categoryId_idx" ON "booking"("categoryId");

-- CreateIndex
CREATE INDEX "booking_subcategoryId_idx" ON "booking"("subcategoryId");

-- CreateIndex
CREATE INDEX "booking_serviceTypeId_idx" ON "booking"("serviceTypeId");

-- CreateIndex
CREATE INDEX "booking_packageId_idx" ON "booking"("packageId");

-- CreateIndex
CREATE INDEX "bookingassignment_vendorId_status_idx" ON "bookingassignment"("vendorId", "status");

-- CreateIndex
CREATE INDEX "bookingassignment_bookingId_status_idx" ON "bookingassignment"("bookingId", "status");

-- CreateIndex
CREATE INDEX "BookingAssignment_vendorId_idx" ON "bookingassignment"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingAssignment_bookingId_vendorId_key" ON "bookingassignment"("bookingId", "vendorId");

-- CreateIndex
CREATE INDEX "BookingItem_bookingId_idx" ON "bookingitem"("bookingId");

-- CreateIndex
CREATE INDEX "BookingItem_packageId_idx" ON "bookingitem"("packageId");

-- CreateIndex
CREATE INDEX "BookingItem_serviceId_idx" ON "bookingitem"("serviceId");

-- CreateIndex
CREATE INDEX "BookingStatusLog_bookingId_idx" ON "bookingstatuslog"("bookingId");

-- CreateIndex
CREATE INDEX "Staff_bookingId_idx" ON "staff"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_customerProfileId_key" ON "cart"("customerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_targetId_type_key" ON "cartitem"("cartId", "targetId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "eventtype_name_key" ON "eventtype"("name");

-- CreateIndex
CREATE INDEX "eventtype_isActive_idx" ON "eventtype"("isActive");

-- CreateIndex
CREATE INDEX "category_eventTypeId_idx" ON "category"("eventTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "category_name_eventTypeId_key" ON "category"("name", "eventTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_bookingId_key" ON "conversation"("bookingId");

-- CreateIndex
CREATE INDEX "ConversationParticipant_userId_idx" ON "conversationparticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "conversationparticipant"("conversationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "coupon"("code");

-- CreateIndex
CREATE INDEX "recently_viewed_customerProfileId_idx" ON "recently_viewed"("customerProfileId");

-- CreateIndex
CREATE INDEX "recently_viewed_timestamp_idx" ON "recently_viewed"("timestamp");

-- CreateIndex
CREATE INDEX "saved_search_customerProfileId_idx" ON "saved_search"("customerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "referral_referredId_key" ON "referral"("referredId");

-- CreateIndex
CREATE INDEX "loyalty_transaction_customerProfileId_idx" ON "loyalty_transaction"("customerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_bookingId_key" ON "dispute"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "EventCheckin_bookingId_key" ON "eventcheckin"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalSettings_key_key" ON "globalsettings"("key");

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
CREATE UNIQUE INDEX "Invoice_bookingId_key" ON "invoice"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "LocationTrackingLog_userId_idx" ON "locationtrackinglog"("userId");

-- CreateIndex
CREATE INDEX "Message_bookingId_idx" ON "message"("bookingId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "message"("senderId");

-- CreateIndex
CREATE INDEX "MessageAttachment_messageId_idx" ON "messageattachment"("messageId");

-- CreateIndex
CREATE INDEX "notification_userId_isRead_createdAt_idx" ON "notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "notification"("userId");

-- CreateIndex
CREATE INDEX "notification_category_idx" ON "notification"("category");

-- CreateIndex
CREATE INDEX "notification_isRead_idx" ON "notification"("isRead");

-- CreateIndex
CREATE INDEX "notification_createdAt_idx" ON "notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preference_userId_key" ON "notification_preference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preference_userId_category_key" ON "notification_preference"("userId", "category");

-- CreateIndex
CREATE INDEX "Package_serviceId_idx" ON "package"("serviceId");

-- CreateIndex
CREATE INDEX "package_price_idx" ON "package"("price");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_razorpayOrderId_key" ON "payment"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_razorpayPaymentId_key" ON "payment"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "payment_bookingId_status_createdAt_idx" ON "payment"("bookingId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_bookingId_idx" ON "payment"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transaction_externalTransactionId_key" ON "payment_transaction"("externalTransactionId");

-- CreateIndex
CREATE INDEX "payment_transaction_paymentId_idx" ON "payment_transaction"("paymentId");

-- CreateIndex
CREATE INDEX "payment_transaction_externalTransactionId_idx" ON "payment_transaction"("externalTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_split_paymentId_key" ON "payment_split"("paymentId");

-- CreateIndex
CREATE INDEX "payment_split_paymentId_idx" ON "payment_split"("paymentId");

-- CreateIndex
CREATE INDEX "payment_split_bookingId_idx" ON "payment_split"("bookingId");

-- CreateIndex
CREATE INDEX "payment_split_vendorId_idx" ON "payment_split"("vendorId");

-- CreateIndex
CREATE INDEX "payment_split_customerProfileId_idx" ON "payment_split"("customerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_reference_key" ON "payout"("reference");

-- CreateIndex
CREATE INDEX "Payout_vendorId_idx" ON "payout"("vendorId");

-- CreateIndex
CREATE INDEX "Portfolio_serviceId_idx" ON "portfolio"("serviceId");

-- CreateIndex
CREATE INDEX "Portfolio_vendorProfileId_idx" ON "portfolio"("vendorProfileId");

-- CreateIndex
CREATE INDEX "PricingRule_packageId_idx" ON "pricingrule"("packageId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "refreshtoken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "refreshtoken"("userId");

-- CreateIndex
CREATE INDEX "refreshtoken_expiryDate_idx" ON "refreshtoken"("expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_bookingId_key" ON "refund"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "review_bookingId_key" ON "review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_serviceId_idx" ON "review"("serviceId");

-- CreateIndex
CREATE INDEX "Review_customerProfileId_idx" ON "review"("customerProfileId");

-- CreateIndex
CREATE INDEX "Review_vendorId_idx" ON "review"("vendorId");

-- CreateIndex
CREATE INDEX "Review_bookingId_idx" ON "review"("bookingId");

-- CreateIndex
CREATE INDEX "review_moderationStatus_idx" ON "review"("moderationStatus");

-- CreateIndex
CREATE INDEX "Service_serviceTypeId_idx" ON "service"("serviceTypeId");

-- CreateIndex
CREATE INDEX "service_vendorProfileId_basePrice_idx" ON "service"("vendorProfileId", "basePrice");

-- CreateIndex
CREATE INDEX "Service_vendorProfileId_idx" ON "service"("vendorProfileId");

-- CreateIndex
CREATE INDEX "service_title_idx" ON "service"("title");

-- CreateIndex
CREATE INDEX "service_basePrice_idx" ON "service"("basePrice");

-- CreateIndex
CREATE INDEX "ServiceType_subcategoryId_idx" ON "servicetype"("subcategoryId");

-- CreateIndex
CREATE INDEX "Subcategory_categoryId_idx" ON "subcategory"("categoryId");

-- CreateIndex
CREATE INDEX "Transaction_walletId_idx" ON "transaction"("walletId");

-- CreateIndex
CREATE INDEX "transaction_createdAt_idx" ON "transaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobileNumber_key" ON "user"("mobileNumber");

-- CreateIndex
CREATE INDEX "user_fullName_idx" ON "user"("fullName");

-- CreateIndex
CREATE UNIQUE INDEX "customerprofile_userId_key" ON "customerprofile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "customerprofile_referralCode_key" ON "customerprofile"("referralCode");

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
CREATE INDEX "marketing_analytics_customerProfileId_idx" ON "marketing_analytics"("customerProfileId");

-- CreateIndex
CREATE INDEX "marketing_analytics_eventType_idx" ON "marketing_analytics"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "customer_crm_data_customerProfileId_key" ON "customer_crm_data"("customerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_crm_data_vendorId_key" ON "vendor_crm_data"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "message_template_name_key" ON "message_template"("name");

-- CreateIndex
CREATE UNIQUE INDEX "seo_metadata_path_key" ON "seo_metadata"("path");

-- CreateIndex
CREATE INDEX "referral_fraud_log_customerProfileId_idx" ON "referral_fraud_log"("customerProfileId");

-- CreateIndex
CREATE INDEX "event_workspace_customerProfileId_idx" ON "event_workspace"("customerProfileId");

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
CREATE INDEX "address_customerProfileId_idx" ON "address"("customerProfileId");

-- CreateIndex
CREATE INDEX "address_city_idx" ON "address"("city");

-- CreateIndex
CREATE INDEX "search_analytics_createdAt_idx" ON "search_analytics"("createdAt");

-- CreateIndex
CREATE INDEX "search_analytics_city_idx" ON "search_analytics"("city");

-- CreateIndex
CREATE INDEX "search_analytics_category_idx" ON "search_analytics"("category");

-- CreateIndex
CREATE INDEX "VendorDocument_vendorProfileId_idx" ON "vendordocument"("vendorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_payout_reference_key" ON "vendor_payout"("reference");

-- CreateIndex
CREATE INDEX "vendor_payout_vendorId_idx" ON "vendor_payout"("vendorId");

-- CreateIndex
CREATE INDEX "vendorteam_vendorProfileId_idx" ON "vendorteam"("vendorProfileId");

-- CreateIndex
CREATE INDEX "vendor_penalty_vendorId_idx" ON "vendor_penalty"("vendorId");

-- CreateIndex
CREATE INDEX "vendor_penalty_bookingId_idx" ON "vendor_penalty"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProfile_userId_key" ON "vendorprofile"("userId");

-- CreateIndex
CREATE INDEX "vendorprofile_verificationStatus_idx" ON "vendorprofile"("verificationStatus");

-- CreateIndex
CREATE INDEX "vendorprofile_userId_verificationStatus_idx" ON "vendorprofile"("userId", "verificationStatus");

-- CreateIndex
CREATE INDEX "vendorprofile_city_idx" ON "vendorprofile"("city");

-- CreateIndex
CREATE INDEX "vendorprofile_rating_idx" ON "vendorprofile"("rating");

-- CreateIndex
CREATE INDEX "vendorprofile_reviewCount_idx" ON "vendorprofile"("reviewCount");

-- CreateIndex
CREATE INDEX "vendorprofile_totalBookings_idx" ON "vendorprofile"("totalBookings");

-- CreateIndex
CREATE INDEX "vendorprofile_businessName_idx" ON "vendorprofile"("businessName");

-- CreateIndex
CREATE INDEX "vendorprofile_searchScore_idx" ON "vendorprofile"("searchScore");

-- CreateIndex
CREATE INDEX "vendorprofile_createdAt_idx" ON "vendorprofile"("createdAt");

-- CreateIndex
CREATE INDEX "vendorprofile_city_verificationStatus_rating_idx" ON "vendorprofile"("city", "verificationStatus", "rating");

-- CreateIndex
CREATE INDEX "vendorprofile_verificationStatus_searchScore_idx" ON "vendorprofile"("verificationStatus", "searchScore");

-- CreateIndex
CREATE INDEX "vendorprofile_latitude_idx" ON "vendorprofile"("latitude");

-- CreateIndex
CREATE INDEX "vendorprofile_longitude_idx" ON "vendorprofile"("longitude");

-- CreateIndex
CREATE INDEX "RecurringAvailability_vendorProfileId_idx" ON "recurringavailability"("vendorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "recurringavailability_vendorProfileId_dayOfWeek_key" ON "recurringavailability"("vendorProfileId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "VendorScore_vendorProfileId_key" ON "vendorscore"("vendorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_eventId_key" ON "webhookevent"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_customerProfileId_key" ON "wishlist"("customerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_wishlistId_targetId_type_key" ON "wishlistitem"("wishlistId", "targetId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "order_orderNumber_key" ON "order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "order_idempotencyKey_key" ON "order"("idempotencyKey");

-- CreateIndex
CREATE INDEX "order_customerProfileId_idx" ON "order"("customerProfileId");

-- CreateIndex
CREATE INDEX "order_status_idx" ON "order"("status");

-- CreateIndex
CREATE INDEX "order_createdAt_idx" ON "order"("createdAt");

-- CreateIndex
CREATE INDEX "order_item_orderId_idx" ON "order_item"("orderId");

-- CreateIndex
CREATE INDEX "order_item_vendorId_idx" ON "order_item"("vendorId");

-- CreateIndex
CREATE INDEX "reservation_vendorId_eventDate_idx" ON "reservation"("vendorId", "eventDate");

-- CreateIndex
CREATE INDEX "reservation_expiresAt_idx" ON "reservation"("expiresAt");

-- CreateIndex
CREATE INDEX "reservation_status_idx" ON "reservation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "passwordresettoken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "passwordresettoken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPayment_razorpayOrderId_key" ON "subscriptionpayment"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPayment_razorpayPaymentId_key" ON "subscriptionpayment"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_subscriptionId_idx" ON "subscriptionpayment"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON "subscriptionplan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VendorSubscription_vendorProfileId_key" ON "vendorsubscription"("vendorProfileId");

-- CreateIndex
CREATE INDEX "VendorSubscription_planId_idx" ON "vendorsubscription"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "reportschedule_vendorProfileId_key" ON "reportschedule"("vendorProfileId");

-- CreateIndex
CREATE INDEX "reportschedule_vendorProfileId_idx" ON "reportschedule"("vendorProfileId");

-- CreateIndex
CREATE INDEX "reportschedule_nextRun_idx" ON "reportschedule"("nextRun");

-- CreateIndex
CREATE INDEX "expense_vendorProfileId_idx" ON "expense"("vendorProfileId");

-- CreateIndex
CREATE INDEX "expense_category_idx" ON "expense"("category");

-- CreateIndex
CREATE INDEX "expense_date_idx" ON "expense"("date");

-- CreateIndex
CREATE INDEX "booking_timeline_bookingId_idx" ON "booking_timeline"("bookingId");

-- CreateIndex
CREATE INDEX "vendor_team_vendorProfileId_idx" ON "vendor_team"("vendorProfileId");

-- CreateIndex
CREATE INDEX "vendor_team_member_teamId_idx" ON "vendor_team_member"("teamId");

-- CreateIndex
CREATE INDEX "booking_team_assignment_bookingId_idx" ON "booking_team_assignment"("bookingId");

-- CreateIndex
CREATE INDEX "booking_team_assignment_memberId_idx" ON "booking_team_assignment"("memberId");

-- CreateIndex
CREATE INDEX "checklist_template_categoryId_idx" ON "checklist_template"("categoryId");

-- CreateIndex
CREATE INDEX "booking_checklist_bookingId_idx" ON "booking_checklist"("bookingId");

-- CreateIndex
CREATE INDEX "booking_document_bookingId_idx" ON "booking_document"("bookingId");

-- CreateIndex
CREATE INDEX "audit_log_bookingId_createdAt_idx" ON "audit_log"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_log_bookingId_idx" ON "audit_log"("bookingId");

-- CreateIndex
CREATE INDEX "audit_log_vendorId_idx" ON "audit_log"("vendorId");

-- CreateIndex
CREATE INDEX "audit_log_customerProfileId_idx" ON "audit_log"("customerProfileId");

-- CreateIndex
CREATE INDEX "audit_log_createdAt_idx" ON "audit_log"("createdAt");

-- CreateIndex
CREATE INDEX "audit_log_module_idx" ON "audit_log"("module");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "refund_request_bookingId_idx" ON "refund_request"("bookingId");

-- CreateIndex
CREATE INDEX "package_addon_packageId_idx" ON "package_addon"("packageId");

-- CreateIndex
CREATE INDEX "booking_addon_bookingId_idx" ON "booking_addon"("bookingId");

-- CreateIndex
CREATE INDEX "booking_addon_addonId_idx" ON "booking_addon"("addonId");

-- CreateIndex
CREATE INDEX "counterquote_bookingId_idx" ON "counterquote"("bookingId");

-- AddForeignKey
ALTER TABLE "activitylog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditlog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability" ADD CONSTRAINT "Availability_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "Booking_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "Booking_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "customerprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "Booking_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendorprofile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookingassignment" ADD CONSTRAINT "BookingAssignment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookingassignment" ADD CONSTRAINT "BookingAssignment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookingitem" ADD CONSTRAINT "BookingItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookingitem" ADD CONSTRAINT "BookingItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookingitem" ADD CONSTRAINT "BookingItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookingstatuslog" ADD CONSTRAINT "BookingStatusLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "Staff_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart" ADD CONSTRAINT "Cart_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "customerprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartitem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "eventtype"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "Conversation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversationparticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversationparticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon" ADD CONSTRAINT "coupon_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "customerprofile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendorprofile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_search" ADD CONSTRAINT "saved_search_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "customerprofile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral" ADD CONSTRAINT "referral_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "customerprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral" ADD CONSTRAINT "referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "customerprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transaction" ADD CONSTRAINT "loyalty_transaction_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "customerprofile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute" ADD CONSTRAINT "Dispute_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventcheckin" ADD CONSTRAINT "EventCheckin_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement" ADD CONSTRAINT "settlement_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement" ADD CONSTRAINT "settlement_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_detection_log" ADD CONSTRAINT "fraud_detection_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_detection_log" ADD CONSTRAINT "fraud_detection_log_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendorprofile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "Invoice_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locationtrackinglog" ADD CONSTRAINT "LocationTrackingLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "Message_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messageattachment" ADD CONSTRAINT "MessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package" ADD CONSTRAINT "Package_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transaction" ADD CONSTRAINT "payment_transaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_split" ADD CONSTRAINT "payment_split_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_split" ADD CONSTRAINT "payment_split_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "customerprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_split" ADD CONSTRAINT "payment_split_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_split" ADD CONSTRAINT "payment_split_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout" ADD CONSTRAINT "Payout_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio" ADD CONSTRAINT "Portfolio_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio" ADD CONSTRAINT "Portfolio_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricingrule" ADD CONSTRAINT "PricingRule_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refreshtoken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund" ADD CONSTRAINT "Refund_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "Review_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "customerprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "Review_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "Review_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "Service_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "servicetype"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "Service_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicetype" ADD CONSTRAINT "ServiceType_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customerprofile" ADD CONSTRAINT "customerprofile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_ticket_message" ADD CONSTRAINT "support_ticket_message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_ticket_message" ADD CONSTRAINT "support_ticket_message_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancellation_record" ADD CONSTRAINT "cancellation_record_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaign" ADD CONSTRAINT "marketing_campaign_targetSegmentId_fkey" FOREIGN KEY ("targetSegmentId") REFERENCES "customer_segment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_analytics" ADD CONSTRAINT "marketing_analytics_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_analytics" ADD CONSTRAINT "marketing_analytics_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "customerprofile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_crm_data" ADD CONSTRAINT "customer_crm_data_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "customerprofile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_crm_data" ADD CONSTRAINT "vendor_crm_data_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendorprofile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_fraud_log" ADD CONSTRAINT "referral_fraud_log_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "customerprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_workspace" ADD CONSTRAINT "event_workspace_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "customerprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_collaborator" ADD CONSTRAINT "event_collaborator_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "customerprofile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_collaborator" ADD CONSTRAINT "event_collaborator_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "event_workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_checklist_item" ADD CONSTRAINT "event_checklist_item_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "customerprofile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_checklist_item" ADD CONSTRAINT "event_checklist_item_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "event_workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_guest" ADD CONSTRAINT "event_guest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "event_workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_budget_item" ADD CONSTRAINT "event_budget_item_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "event_workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_timeline_item" ADD CONSTRAINT "event_timeline_item_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "event_workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_note" ADD CONSTRAINT "event_note_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "customerprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_note" ADD CONSTRAINT "event_note_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "event_workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_file" ADD CONSTRAINT "event_file_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "customerprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_file" ADD CONSTRAINT "event_file_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "event_workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_invitation" ADD CONSTRAINT "event_invitation_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "event_guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_invitation" ADD CONSTRAINT "event_invitation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "event_workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_emergency_contact" ADD CONSTRAINT "event_emergency_contact_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "event_workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_incident_report" ADD CONSTRAINT "event_incident_report_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "event_workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "address" ADD CONSTRAINT "address_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "customerprofile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendordocument" ADD CONSTRAINT "VendorDocument_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_payout" ADD CONSTRAINT "vendor_payout_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendorteam" ADD CONSTRAINT "vendorteam_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_penalty" ADD CONSTRAINT "vendor_penalty_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_penalty" ADD CONSTRAINT "vendor_penalty_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendorprofile" ADD CONSTRAINT "VendorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendorprofile" ADD CONSTRAINT "vendorprofile_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurringavailability" ADD CONSTRAINT "RecurringAvailability_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendorscore" ADD CONSTRAINT "VendorScore_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist" ADD CONSTRAINT "Wishlist_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "customerprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlistitem" ADD CONSTRAINT "WishlistItem_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "wishlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_customerProfileId_fkey" FOREIGN KEY ("customerProfileId") REFERENCES "customerprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptionpayment" ADD CONSTRAINT "SubscriptionPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "vendorsubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendorsubscription" ADD CONSTRAINT "VendorSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscriptionplan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendorsubscription" ADD CONSTRAINT "VendorSubscription_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportschedule" ADD CONSTRAINT "reportschedule_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_timeline" ADD CONSTRAINT "booking_timeline_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_team" ADD CONSTRAINT "vendor_team_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_team_member" ADD CONSTRAINT "vendor_team_member_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "vendor_team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_team_assignment" ADD CONSTRAINT "booking_team_assignment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_team_assignment" ADD CONSTRAINT "booking_team_assignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "vendor_team_member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_template" ADD CONSTRAINT "checklist_template_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_checklist" ADD CONSTRAINT "booking_checklist_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_document" ADD CONSTRAINT "booking_document_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_request" ADD CONSTRAINT "refund_request_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_addon" ADD CONSTRAINT "package_addon_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_addon" ADD CONSTRAINT "booking_addon_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "package_addon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_addon" ADD CONSTRAINT "booking_addon_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counterquote" ADD CONSTRAINT "counterquote_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
