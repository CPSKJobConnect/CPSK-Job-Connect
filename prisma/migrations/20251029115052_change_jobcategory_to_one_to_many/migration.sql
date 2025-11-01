/*
  Warnings:

  - You are about to drop the `_JobCategoriesOnPosts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."_JobCategoriesOnPosts" DROP CONSTRAINT "_JobCategoriesOnPosts_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_JobCategoriesOnPosts" DROP CONSTRAINT "_JobCategoriesOnPosts_B_fkey";

-- AlterTable
ALTER TABLE "JobPost" ADD COLUMN     "job_category_id" INTEGER;

-- DropTable
DROP TABLE "public"."_JobCategoriesOnPosts";

-- AddForeignKey
ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_job_category_id_fkey" FOREIGN KEY ("job_category_id") REFERENCES "JobCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
