-- Safe migration script for adding company verification fields
-- This preserves existing data by converting values properly

-- Step 1: Add new columns (these are safe operations)
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "verification_notes" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMP(3);
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "verified_by" INTEGER;

-- Step 2: Update existing registration_status values to match enum format
-- Convert lowercase to uppercase to match VerificationStatus enum
UPDATE "Company"
SET "registration_status" =
  CASE
    WHEN LOWER("registration_status") = 'pending' THEN 'PENDING'
    WHEN LOWER("registration_status") = 'approved' THEN 'APPROVED'
    WHEN LOWER("registration_status") = 'rejected' THEN 'REJECTED'
    ELSE 'PENDING'  -- Default to PENDING for any unexpected values
  END
WHERE "registration_status" IS NOT NULL;

-- Step 3: Change the column type to use VerificationStatus enum
ALTER TABLE "Company"
  ALTER COLUMN "registration_status" TYPE "VerificationStatus"
  USING "registration_status"::"VerificationStatus";

-- Step 4: Set default value
ALTER TABLE "Company"
  ALTER COLUMN "registration_status" SET DEFAULT 'PENDING'::"VerificationStatus";

-- Step 5: Add foreign key constraint for verified_by
ALTER TABLE "Company"
  ADD CONSTRAINT "Company_verified_by_fkey"
  FOREIGN KEY ("verified_by")
  REFERENCES "Account"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Step 6: Add index for better query performance
CREATE INDEX IF NOT EXISTS "Company_registration_status_idx"
  ON "Company"("registration_status");

-- Verify the migration
SELECT
  COUNT(*) as total_companies,
  COUNT(CASE WHEN "registration_status" = 'PENDING' THEN 1 END) as pending,
  COUNT(CASE WHEN "registration_status" = 'APPROVED' THEN 1 END) as approved,
  COUNT(CASE WHEN "registration_status" = 'REJECTED' THEN 1 END) as rejected
FROM "Company";
