/*
  Warnings:

  - You are about to drop the column `token` on the `refreshtoken` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tokenHash]` on the table `refreshtoken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tokenHash` to the `refreshtoken` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "refreshtoken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropIndex
DROP INDEX "RefreshToken_token_key";

-- AlterTable
ALTER TABLE "refreshtoken" DROP COLUMN "token",
ADD COLUMN     "browser" TEXT,
ADD COLUMN     "deviceName" TEXT,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "os" TEXT,
ADD COLUMN     "replacedBy" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "tokenHash" VARCHAR(255) NOT NULL,
ADD COLUMN     "userAgent" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "refreshtoken"("tokenHash");

-- CreateIndex
CREATE INDEX "refreshtoken_tokenHash_idx" ON "refreshtoken"("tokenHash");

-- AddForeignKey
ALTER TABLE "refreshtoken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
