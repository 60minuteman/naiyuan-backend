/*
  Warnings:

  - Added the required column `customerEmail` to the `VirtualAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerName` to the `VirtualAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerPhone` to the `VirtualAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiryDuration` to the `VirtualAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payscribeAccountId` to the `VirtualAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payscribeCustomerId` to the `VirtualAccount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VirtualAccount" ADD COLUMN     "customerEmail" TEXT NOT NULL,
ADD COLUMN     "customerName" TEXT NOT NULL,
ADD COLUMN     "customerPhone" TEXT NOT NULL,
ADD COLUMN     "expiryDuration" INTEGER NOT NULL,
ADD COLUMN     "payscribeAccountId" TEXT NOT NULL,
ADD COLUMN     "payscribeCustomerId" TEXT NOT NULL;
