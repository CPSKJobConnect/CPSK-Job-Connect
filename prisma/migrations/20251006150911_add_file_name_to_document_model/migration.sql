/*
  Warnings:

  - Added the required column `file_name` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Document" ADD COLUMN     "file_name" TEXT NOT NULL;
