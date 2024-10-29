/*
  Warnings:

  - The values [SUCCESS,FAILED] on the enum `VerificationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VerificationStatus_new" AS ENUM ('PENDING', 'VERIFIED');
ALTER TABLE "User" ALTER COLUMN "verificationStatus" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "verificationStatus" TYPE "VerificationStatus_new" USING ("verificationStatus"::text::"VerificationStatus_new");
ALTER TYPE "VerificationStatus" RENAME TO "VerificationStatus_old";
ALTER TYPE "VerificationStatus_new" RENAME TO "VerificationStatus";
DROP TYPE "VerificationStatus_old";
ALTER TABLE "User" ALTER COLUMN "verificationStatus" SET DEFAULT 'PENDING';
COMMIT;

-- DropIndex
DROP INDEX "OTPStore_userId_idx";
