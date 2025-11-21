-- Add token_version to track session invalidation
ALTER TABLE "Account" ADD COLUMN "token_version" INTEGER NOT NULL DEFAULT 0;
