-- DropForeignKey
ALTER TABLE "public"."Application" DROP CONSTRAINT "Application_student_id_fkey";

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;