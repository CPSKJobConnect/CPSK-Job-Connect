/*
  Warnings:

  - Changed the type of `target` on the `ReportType` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ReportType" DROP COLUMN "target",
ADD COLUMN     "target" TEXT NOT NULL;

-- DropEnum
DROP TYPE "public"."ReportTarget";
