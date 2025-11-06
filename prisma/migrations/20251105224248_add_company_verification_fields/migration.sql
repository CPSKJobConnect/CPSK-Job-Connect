-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "verification_notes" TEXT,
ADD COLUMN     "verified_at" TIMESTAMP(3),
ADD COLUMN     "verified_by" INTEGER;

-- CreateIndex
CREATE INDEX "Company_registration_status_idx" ON "Company"("registration_status");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
