/*
  Warnings:

  - You are about to drop the `Application_status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Document_type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Job_Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Job_Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_JobPostTags` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[provider,providerAccountId]` on the table `Account` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."Account" DROP CONSTRAINT "Account_role_fkey";

-- DropForeignKey
ALTER TABLE "public"."Application" DROP CONSTRAINT "Application_job_post_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Application" DROP CONSTRAINT "Application_status_fkey";

-- DropForeignKey
ALTER TABLE "public"."Document" DROP CONSTRAINT "Document_doc_type_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Job_Post" DROP CONSTRAINT "Job_Post_company_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."_JobPostTags" DROP CONSTRAINT "_JobPostTags_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_JobPostTags" DROP CONSTRAINT "_JobPostTags_B_fkey";

-- AlterTable
ALTER TABLE "public"."Account" ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "image" TEXT,
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "providerAccountId" TEXT,
ALTER COLUMN "username" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "role" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Company" ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "public"."Student" ADD COLUMN     "transcript" TEXT,
ALTER COLUMN "year" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "public"."Application_status";

-- DropTable
DROP TABLE "public"."Document_type";

-- DropTable
DROP TABLE "public"."Job_Post";

-- DropTable
DROP TABLE "public"."Job_Tag";

-- DropTable
DROP TABLE "public"."_JobPostTags";

-- CreateTable
CREATE TABLE "public"."DocumentType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "DocumentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobPost" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "jobName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "aboutRole" TEXT NOT NULL,
    "requirements" TEXT[],
    "qualifications" TEXT[],
    "min_salary" INTEGER NOT NULL,
    "max_salary" INTEGER NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "JobType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobArrangement" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "JobArrangement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "JobCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobTag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "JobTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApplicationStatus" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ApplicationStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."_JobTypesOnPosts" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_JobTypesOnPosts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_JobTagesOnPosts" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_JobTagesOnPosts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_JobArrangementsOnPosts" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_JobArrangementsOnPosts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_JobCategoriesOnPosts" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_JobCategoriesOnPosts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobType_name_key" ON "public"."JobType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "JobArrangement_name_key" ON "public"."JobArrangement"("name");

-- CreateIndex
CREATE UNIQUE INDEX "JobCategory_name_key" ON "public"."JobCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "public"."sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "public"."verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "public"."verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "_JobTypesOnPosts_B_index" ON "public"."_JobTypesOnPosts"("B");

-- CreateIndex
CREATE INDEX "_JobTagesOnPosts_B_index" ON "public"."_JobTagesOnPosts"("B");

-- CreateIndex
CREATE INDEX "_JobArrangementsOnPosts_B_index" ON "public"."_JobArrangementsOnPosts"("B");

-- CreateIndex
CREATE INDEX "_JobCategoriesOnPosts_B_index" ON "public"."_JobCategoriesOnPosts"("B");

-- CreateIndex
CREATE INDEX "Account_email_idx" ON "public"."Account"("email");

-- CreateIndex
CREATE INDEX "Account_role_idx" ON "public"."Account"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_role_fkey" FOREIGN KEY ("role") REFERENCES "public"."AccountRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_doc_type_id_fkey" FOREIGN KEY ("doc_type_id") REFERENCES "public"."DocumentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobPost" ADD CONSTRAINT "JobPost_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_job_post_id_fkey" FOREIGN KEY ("job_post_id") REFERENCES "public"."JobPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_status_fkey" FOREIGN KEY ("status") REFERENCES "public"."ApplicationStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_JobTypesOnPosts" ADD CONSTRAINT "_JobTypesOnPosts_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_JobTypesOnPosts" ADD CONSTRAINT "_JobTypesOnPosts_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."JobType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_JobTagesOnPosts" ADD CONSTRAINT "_JobTagesOnPosts_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_JobTagesOnPosts" ADD CONSTRAINT "_JobTagesOnPosts_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."JobTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_JobArrangementsOnPosts" ADD CONSTRAINT "_JobArrangementsOnPosts_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."JobArrangement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_JobArrangementsOnPosts" ADD CONSTRAINT "_JobArrangementsOnPosts_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_JobCategoriesOnPosts" ADD CONSTRAINT "_JobCategoriesOnPosts_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."JobCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_JobCategoriesOnPosts" ADD CONSTRAINT "_JobCategoriesOnPosts_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
