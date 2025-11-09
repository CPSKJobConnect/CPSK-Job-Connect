-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "sender_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
