-- CreateTable
CREATE TABLE "_RequiredDocsOnPost" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RequiredDocsOnPost_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RequiredDocsOnPost_B_index" ON "_RequiredDocsOnPost"("B");

-- CreateIndex
CREATE INDEX "Notification_account_id_sender_id_is_read_idx" ON "Notification"("account_id", "sender_id", "is_read");

-- AddForeignKey
ALTER TABLE "_RequiredDocsOnPost" ADD CONSTRAINT "_RequiredDocsOnPost_A_fkey" FOREIGN KEY ("A") REFERENCES "DocumentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RequiredDocsOnPost" ADD CONSTRAINT "_RequiredDocsOnPost_B_fkey" FOREIGN KEY ("B") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
