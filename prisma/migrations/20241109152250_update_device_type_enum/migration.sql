/*
  Warnings:

  - Changed the type of `deviceType` on the `Device` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Device" DROP COLUMN "deviceType",
ADD COLUMN     "deviceType" "DeviceType" NOT NULL;
