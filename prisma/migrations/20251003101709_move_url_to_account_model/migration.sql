/*
  Warnings:

  - You are about to drop the column `image` on the `Account` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Account" DROP COLUMN "image",
ADD COLUMN     "backgroundUrl" TEXT,
ADD COLUMN     "logoUrl" TEXT;
