-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('CURRENT', 'ALUMNI');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "email_verified" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "student_status" "StudentStatus" NOT NULL DEFAULT 'CURRENT',
ADD COLUMN     "verification_notes" TEXT,
ADD COLUMN     "verification_status" "VerificationStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "verified_at" TIMESTAMP(3),
ADD COLUMN     "verified_by" INTEGER;

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_email_idx" ON "email_verification_tokens"("email");

-- CreateIndex
CREATE INDEX "email_verification_tokens_token_idx" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "Student_account_id_idx" ON "Student"("account_id");

-- CreateIndex
CREATE INDEX "Student_student_status_idx" ON "Student"("student_status");

-- CreateIndex
CREATE INDEX "Student_verification_status_idx" ON "Student"("verification_status");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
