-- DropForeignKey
ALTER TABLE "public"."Application" DROP CONSTRAINT "Application_job_post_id_fkey";

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_job_post_id_fkey" FOREIGN KEY ("job_post_id") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
