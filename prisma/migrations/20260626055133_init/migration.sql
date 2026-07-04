-- CreateEnum
CREATE TYPE "bookingstatuslog_status" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'NEGOTIATING', 'CONFIRMED', 'CANCELLED', 'VENDOR_ASSIGNED', 'VENDOR_TRAVELING', 'VENDOR_ARRIVED', 'OTP_VERIFICATION_PENDING', 'EVENT_STARTED', 'EVENT_ONGOING', 'EVENT_COMPLETED');

-- CreateEnum
CREATE TYPE "bookingassignment_status" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'REASSIGNED');

-- CreateEnum
CREATE TYPE "payout_status" AS ENUM ('PENDING', 'PROCESSING', 'RELEASED', 'FAILED');

-- CreateEnum
CREATE TYPE "booking_status" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'NEGOTIATING', 'CONFIRMED', 'CANCELLED', 'VENDOR_ASSIGNED', 'VENDOR_TRAVELING', 'VENDOR_ARRIVED', 'OTP_VERIFICATION_PENDING', 'EVENT_STARTED', 'EVENT_ONGOING', 'EVENT_COMPLETED');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

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
CREATE TYPE "dispute_status" AS ENUM ('OPEN', 'UNDER_INVESTIGATION', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "wallet_type" AS ENUM ('USER', 'VENDOR', 'PLATFORM');

-- CreateEnum
CREATE TYPE "vendorprofile_verificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

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

    CONSTRAINT "availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking" (
    "id" TEXT NOT NULL,
    "bookingNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
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
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cartitem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cartitem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "commissionRate" DECIMAL(5,2),

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

    CONSTRAINT "coupon_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "invoice" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
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

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_split" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "adminShare" DECIMAL(10,2) NOT NULL,
    "vendorShare" DECIMAL(10,2) NOT NULL,
    "commissionRate" DECIMAL(5,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
    "userId" TEXT NOT NULL,
    "serviceId" TEXT,
    "vendorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "images" JSONB,
    "vendorResponse" TEXT,
    "responseAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
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
    "serviceRadius" DOUBLE PRECISION,
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
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "activitylog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "auditlog"("userId");

-- CreateIndex
CREATE INDEX "Availability_vendorProfileId_idx" ON "availability"("vendorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingNumber_key" ON "booking"("bookingNumber");

-- CreateIndex
CREATE INDEX "Booking_couponId_idx" ON "booking"("couponId");

-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "booking"("customerId");

-- CreateIndex
CREATE INDEX "Booking_vendorId_idx" ON "booking"("vendorId");

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
CREATE UNIQUE INDEX "Cart_userId_key" ON "cart"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_targetId_type_key" ON "cartitem"("cartId", "targetId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_bookingId_key" ON "conversation"("bookingId");

-- CreateIndex
CREATE INDEX "ConversationParticipant_userId_idx" ON "conversationparticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "conversationparticipant"("conversationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_bookingId_key" ON "dispute"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "EventCheckin_bookingId_key" ON "eventcheckin"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalSettings_key_key" ON "globalsettings"("key");

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
CREATE INDEX "Notification_userId_idx" ON "notification"("userId");

-- CreateIndex
CREATE INDEX "Package_serviceId_idx" ON "package"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_razorpayOrderId_key" ON "payment"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_razorpayPaymentId_key" ON "payment"("razorpayPaymentId");

-- CreateIndex
CREATE INDEX "Payment_bookingId_idx" ON "payment"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_split_paymentId_key" ON "payment_split"("paymentId");

-- CreateIndex
CREATE INDEX "payment_split_paymentId_idx" ON "payment_split"("paymentId");

-- CreateIndex
CREATE INDEX "payment_split_bookingId_idx" ON "payment_split"("bookingId");

-- CreateIndex
CREATE INDEX "payment_split_vendorId_idx" ON "payment_split"("vendorId");

-- CreateIndex
CREATE INDEX "payment_split_customerId_idx" ON "payment_split"("customerId");

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
CREATE INDEX "Review_serviceId_idx" ON "review"("serviceId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "review"("userId");

-- CreateIndex
CREATE INDEX "Review_vendorId_idx" ON "review"("vendorId");

-- CreateIndex
CREATE INDEX "Service_serviceTypeId_idx" ON "service"("serviceTypeId");

-- CreateIndex
CREATE INDEX "Service_vendorProfileId_idx" ON "service"("vendorProfileId");

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
CREATE INDEX "VendorDocument_vendorProfileId_idx" ON "vendordocument"("vendorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProfile_userId_key" ON "vendorprofile"("userId");

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
CREATE UNIQUE INDEX "Wishlist_userId_key" ON "wishlist"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_wishlistId_targetId_type_key" ON "wishlistitem"("wishlistId", "targetId", "type");

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

-- AddForeignKey
ALTER TABLE "activitylog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditlog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability" ADD CONSTRAINT "Availability_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "Booking_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "Booking_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookingassignment" ADD CONSTRAINT "BookingAssignment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookingassignment" ADD CONSTRAINT "BookingAssignment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookingitem" ADD CONSTRAINT "BookingItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookingitem" ADD CONSTRAINT "BookingItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookingitem" ADD CONSTRAINT "BookingItem_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookingstatuslog" ADD CONSTRAINT "BookingStatusLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "Staff_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cartitem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "Conversation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversationparticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversationparticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute" ADD CONSTRAINT "Dispute_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventcheckin" ADD CONSTRAINT "EventCheckin_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "package" ADD CONSTRAINT "Package_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_split" ADD CONSTRAINT "payment_split_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_split" ADD CONSTRAINT "payment_split_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "review" ADD CONSTRAINT "Review_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "vendordocument" ADD CONSTRAINT "VendorDocument_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendorprofile" ADD CONSTRAINT "VendorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurringavailability" ADD CONSTRAINT "RecurringAvailability_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendorscore" ADD CONSTRAINT "VendorScore_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist" ADD CONSTRAINT "Wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlistitem" ADD CONSTRAINT "WishlistItem_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "wishlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptionpayment" ADD CONSTRAINT "SubscriptionPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "vendorsubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendorsubscription" ADD CONSTRAINT "VendorSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscriptionplan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendorsubscription" ADD CONSTRAINT "VendorSubscription_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
