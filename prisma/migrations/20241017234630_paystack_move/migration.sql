/*
  Warnings:

  - You are about to drop the column `amount` on the `VirtualAccount` table. All the data in the column will be lost.
  - You are about to drop the column `expiryDate` on the `VirtualAccount` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VirtualAccount" DROP COLUMN "amount",
DROP COLUMN "expiryDate";
