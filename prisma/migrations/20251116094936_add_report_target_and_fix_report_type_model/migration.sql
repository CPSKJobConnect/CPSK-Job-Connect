/*
  Warnings:

  - Added the required column `target` to the `ReportType` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReportTarget" AS ENUM ('POST', 'GENERAL');

-- AlterTable
ALTER TABLE "ReportType" ADD COLUMN     "target" "ReportTarget" NOT NULL;
