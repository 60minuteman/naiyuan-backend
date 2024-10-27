/*
  Warnings:

  - Added the required column `accountName` to the `VirtualAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bankCode` to the `VirtualAccount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VirtualAccount" ADD COLUMN     "accountName" TEXT NOT NULL,
ADD COLUMN     "bankCode" TEXT NOT NULL;
