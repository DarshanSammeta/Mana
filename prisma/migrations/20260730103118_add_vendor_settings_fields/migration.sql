-- AlterTable
ALTER TABLE "user" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "vendorprofile" ADD COLUMN     "businessType" TEXT DEFAULT 'Individual',
ADD COLUMN     "publicVisibility" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "socialLinks" JSONB,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "workingHours" JSONB;
