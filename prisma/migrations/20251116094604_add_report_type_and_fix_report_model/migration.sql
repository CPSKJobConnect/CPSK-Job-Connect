/*
  Warnings:

  - You are about to drop the column `post_id` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `report_id` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Report` table. All the data in the column will be lost.
  - Added the required column `target_type` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Report" DROP COLUMN "post_id",
DROP COLUMN "report_id",
DROP COLUMN "type",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "report_type_id" INTEGER,
ADD COLUMN     "target_id" INTEGER,
ADD COLUMN     "target_type" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ReportType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ReportType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReportType_name_key" ON "ReportType"("name");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_report_type_id_fkey" FOREIGN KEY ("report_type_id") REFERENCES "ReportType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
