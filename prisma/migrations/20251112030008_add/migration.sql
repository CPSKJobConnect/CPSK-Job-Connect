-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "cv_id" INTEGER,
ADD COLUMN     "transcript_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_cv_id_fkey" FOREIGN KEY ("cv_id") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_transcript_id_fkey" FOREIGN KEY ("transcript_id") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
