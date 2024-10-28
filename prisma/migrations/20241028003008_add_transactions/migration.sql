/*
  Warnings:

  - The primary key for the `Transaction` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `accountName` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `accountNumber` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `bankName` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `recipientContact` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `recipientName` on the `Transaction` table. All the data in the column will be lost.
  - The `id` column on the `Transaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `userId` to the `OTPStore` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentType` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OTPStore" DROP CONSTRAINT "OTPStore_email_fkey";

-- DropIndex
DROP INDEX "OTPStore_email_idx";

-- AlterTable
ALTER TABLE "OTPStore" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_pkey",
DROP COLUMN "accountName",
DROP COLUMN "accountNumber",
DROP COLUMN "bankName",
DROP COLUMN "currency",
DROP COLUMN "paymentMethod",
DROP COLUMN "recipientContact",
DROP COLUMN "recipientName",
ADD COLUMN     "paymentType" "PaymentMethod" NOT NULL,
ADD COLUMN     "recipient" TEXT,
ADD COLUMN     "sender" TEXT,
ADD COLUMN     "subtitle" TEXT,
ADD COLUMN     "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "title" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'COMPLETED',
ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "OTPStore" ADD CONSTRAINT "OTPStore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
