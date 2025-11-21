-- CreateTable
CREATE TABLE "AccountConsentLog" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "consent" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountConsentLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AccountConsentLog" ADD CONSTRAINT "AccountConsentLog_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
