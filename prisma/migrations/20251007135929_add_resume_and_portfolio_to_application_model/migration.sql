-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "portfolio_id" INTEGER,
ADD COLUMN     "resume_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
