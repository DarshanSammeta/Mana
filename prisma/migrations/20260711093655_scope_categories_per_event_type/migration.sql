/*
  Warnings:

  - The values [ACCEPTED] on the enum `booking_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [ACCEPTED] on the enum `bookingstatuslog_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `type` on the `notification` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `booking` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bookingId]` on the table `review` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bookingId` to the `review` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "notification_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "notification_category" AS ENUM ('BOOKING', 'PAYMENT', 'CHAT', 'SYSTEM', 'REVIEW', 'MARKETING');

-- CreateEnum
CREATE TYPE "review_moderationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');

-- AlterEnum
BEGIN;
CREATE TYPE "booking_status_new" AS ENUM ('DRAFT', 'PENDING', 'VENDORS_NOTIFIED', 'QUOTE_RECEIVED', 'NEGOTIATING', 'QUOTE_ACCEPTED', 'PAYMENT_PENDING', 'REJECTED', 'CONFIRMED', 'CANCELLED', 'PREPARATION', 'VENDOR_ASSIGNED', 'VENDOR_TRAVELING', 'VENDOR_ARRIVED', 'OTP_VERIFICATION_PENDING', 'EVENT_STARTED', 'EVENT_ONGOING', 'EVENT_COMPLETED', 'CUSTOMER_CONFIRMED', 'PAYMENT_RELEASED', 'CLOSED');
ALTER TABLE "booking" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "booking" ALTER COLUMN "status" TYPE "booking_status_new" USING ("status"::text::"booking_status_new");
ALTER TYPE "booking_status" RENAME TO "booking_status_old";
ALTER TYPE "booking_status_new" RENAME TO "booking_status";
DROP TYPE "booking_status_old";
ALTER TABLE "booking" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "bookingstatuslog_status_new" AS ENUM ('DRAFT', 'PENDING', 'VENDORS_NOTIFIED', 'QUOTE_RECEIVED', 'NEGOTIATING', 'QUOTE_ACCEPTED', 'PAYMENT_PENDING', 'REJECTED', 'CONFIRMED', 'CANCELLED', 'PREPARATION', 'VENDOR_ASSIGNED', 'VENDOR_TRAVELING', 'VENDOR_ARRIVED', 'OTP_VERIFICATION_PENDING', 'EVENT_STARTED', 'EVENT_ONGOING', 'EVENT_COMPLETED', 'CUSTOMER_CONFIRMED', 'PAYMENT_RELEASED', 'CLOSED');
ALTER TABLE "bookingstatuslog" ALTER COLUMN "status" TYPE "bookingstatuslog_status_new" USING ("status"::text::"bookingstatuslog_status_new");
ALTER TYPE "bookingstatuslog_status" RENAME TO "bookingstatuslog_status_old";
ALTER TYPE "bookingstatuslog_status_new" RENAME TO "bookingstatuslog_status";
DROP TYPE "bookingstatuslog_status_old";
COMMIT;

-- AlterTable
ALTER TABLE "availability" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "peakPriceModifier" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "booking" ADD COLUMN     "checklist" JSONB,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "vendorConfirmedAt5d" BOOLEAN;

-- AlterTable
ALTER TABLE "category" ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "notification" DROP COLUMN "type",
ADD COLUMN     "category" "notification_category" NOT NULL DEFAULT 'SYSTEM',
ADD COLUMN     "emailSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "priority" "notification_priority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "pushSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smsSent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "recurringavailability" ADD COLUMN     "bookingLimit" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "review" ADD COLUMN     "bookingId" TEXT NOT NULL,
ADD COLUMN     "helpfulCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "moderationStatus" "review_moderationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "reportCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "videoUrl" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "profileImage" TEXT;

-- AlterTable
ALTER TABLE "vendorprofile" ADD COLUMN     "advanceBookingDays" INTEGER NOT NULL DEFAULT 365,
ADD COLUMN     "baseTravelCharge" DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN     "bufferTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxTravelDistance" DOUBLE PRECISION DEFAULT 100,
ADD COLUMN     "minBookingNotice" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "travelChargesPerKm" DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN     "vacationEndDate" TIMESTAMP(3),
ADD COLUMN     "vacationMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vacationStartDate" TIMESTAMP(3),
ALTER COLUMN "serviceRadius" SET DEFAULT 50;

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
CREATE TABLE "address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
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
CREATE TABLE "_EventTypeToCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "eventtype_name_key" ON "eventtype"("name");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preference_userId_key" ON "notification_preference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preference_userId_category_key" ON "notification_preference"("userId", "category");

-- CreateIndex
CREATE INDEX "address_userId_idx" ON "address"("userId");

-- CreateIndex
CREATE INDEX "address_city_idx" ON "address"("city");

-- CreateIndex
CREATE INDEX "search_analytics_createdAt_idx" ON "search_analytics"("createdAt");

-- CreateIndex
CREATE INDEX "search_analytics_city_idx" ON "search_analytics"("city");

-- CreateIndex
CREATE INDEX "search_analytics_category_idx" ON "search_analytics"("category");

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
CREATE UNIQUE INDEX "_EventTypeToCategory_AB_unique" ON "_EventTypeToCategory"("A", "B");

-- CreateIndex
CREATE INDEX "_EventTypeToCategory_B_index" ON "_EventTypeToCategory"("B");

-- CreateIndex
CREATE UNIQUE INDEX "booking_idempotencyKey_key" ON "booking"("idempotencyKey");

-- CreateIndex
CREATE INDEX "booking_status_idx" ON "booking"("status");

-- CreateIndex
CREATE INDEX "booking_eventDate_idx" ON "booking"("eventDate");

-- CreateIndex
CREATE INDEX "booking_createdAt_idx" ON "booking"("createdAt");

-- CreateIndex
CREATE INDEX "notification_category_idx" ON "notification"("category");

-- CreateIndex
CREATE INDEX "notification_isRead_idx" ON "notification"("isRead");

-- CreateIndex
CREATE INDEX "notification_createdAt_idx" ON "notification"("createdAt");

-- CreateIndex
CREATE INDEX "package_price_idx" ON "package"("price");

-- CreateIndex
CREATE UNIQUE INDEX "review_bookingId_key" ON "review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_bookingId_idx" ON "review"("bookingId");

-- CreateIndex
CREATE INDEX "review_moderationStatus_idx" ON "review"("moderationStatus");

-- CreateIndex
CREATE INDEX "service_title_idx" ON "service"("title");

-- CreateIndex
CREATE INDEX "service_basePrice_idx" ON "service"("basePrice");

-- CreateIndex
CREATE INDEX "user_fullName_idx" ON "user"("fullName");

-- CreateIndex
CREATE INDEX "vendorprofile_verificationStatus_idx" ON "vendorprofile"("verificationStatus");

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

-- AddForeignKey
ALTER TABLE "notification_preference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "address" ADD CONSTRAINT "address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportschedule" ADD CONSTRAINT "reportschedule_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "vendorprofile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventTypeToCategory" ADD CONSTRAINT "_EventTypeToCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventTypeToCategory" ADD CONSTRAINT "_EventTypeToCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "eventtype"("id") ON DELETE CASCADE ON UPDATE CASCADE;
