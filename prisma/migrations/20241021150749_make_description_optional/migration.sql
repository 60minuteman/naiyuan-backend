/*
  Warnings:

  - Added the required column `amount` to the `VirtualAccount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VirtualAccount" ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "description" TEXT;
