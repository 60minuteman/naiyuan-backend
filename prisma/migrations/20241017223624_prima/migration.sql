/*
  Warnings:

  - You are about to drop the column `bankCode` on the `VirtualAccount` table. All the data in the column will be lost.
  - You are about to drop the column `customerEmail` on the `VirtualAccount` table. All the data in the column will be lost.
  - You are about to drop the column `customerName` on the `VirtualAccount` table. All the data in the column will be lost.
  - You are about to drop the column `customerPhone` on the `VirtualAccount` table. All the data in the column will be lost.
  - You are about to drop the column `expiryDuration` on the `VirtualAccount` table. All the data in the column will be lost.
  - You are about to drop the column `payscribeAccountId` on the `VirtualAccount` table. All the data in the column will be lost.
  - You are about to drop the column `payscribeCustomerId` on the `VirtualAccount` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VirtualAccount" DROP COLUMN "bankCode",
DROP COLUMN "customerEmail",
DROP COLUMN "customerName",
DROP COLUMN "customerPhone",
DROP COLUMN "expiryDuration",
DROP COLUMN "payscribeAccountId",
DROP COLUMN "payscribeCustomerId";
