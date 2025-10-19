/*
  Warnings:

  - You are about to drop the `_JobArrangementsOnPosts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_JobTypesOnPosts` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `job_arrangement_id` to the `JobPost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `job_type_id` to the `JobPost` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."_JobArrangementsOnPosts" DROP CONSTRAINT "_JobArrangementsOnPosts_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_JobArrangementsOnPosts" DROP CONSTRAINT "_JobArrangementsOnPosts_B_fkey";

-- DropForeignKey
ALTER TABLE "public"."_JobTypesOnPosts" DROP CONSTRAINT "_JobTypesOnPosts_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_JobTypesOnPosts" DROP CONSTRAINT "_JobTypesOnPosts_B_fkey";

-- AlterTable
ALTER TABLE "public"."JobPost" ADD COLUMN     "job_arrangement_id" INTEGER NOT NULL,
ADD COLUMN     "job_type_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."_JobArrangementsOnPosts";

-- DropTable
DROP TABLE "public"."_JobTypesOnPosts";

-- AddForeignKey
ALTER TABLE "public"."JobPost" ADD CONSTRAINT "JobPost_job_type_id_fkey" FOREIGN KEY ("job_type_id") REFERENCES "public"."JobType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobPost" ADD CONSTRAINT "JobPost_job_arrangement_id_fkey" FOREIGN KEY ("job_arrangement_id") REFERENCES "public"."JobArrangement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
