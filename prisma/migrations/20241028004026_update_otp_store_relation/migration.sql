/*
  Warnings:

  - Added the required column `updatedAt` to the `OTPStore` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OTPStore" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "OTPStore_userId_idx" ON "OTPStore"("userId");
