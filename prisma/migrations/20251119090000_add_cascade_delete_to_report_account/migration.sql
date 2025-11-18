-- Drop existing foreign key to replace with cascading delete
ALTER TABLE "Report" DROP CONSTRAINT "Report_account_id_fkey";

-- Recreate foreign key with ON DELETE CASCADE so deleting an account removes related reports
ALTER TABLE "Report"
ADD CONSTRAINT "Report_account_id_fkey"
FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
