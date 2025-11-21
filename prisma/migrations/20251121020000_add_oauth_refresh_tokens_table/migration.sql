-- CreateTable
CREATE TABLE "oauth_refresh_tokens" (
    "id" SERIAL NOT NULL,
    "account_id" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rotated_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "replay_detected_at" TIMESTAMP(3),

    CONSTRAINT "oauth_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oauth_refresh_tokens_token_hash_key" ON "oauth_refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "oauth_refresh_tokens_account_id_idx" ON "oauth_refresh_tokens"("account_id");

-- CreateIndex
CREATE INDEX "oauth_refresh_tokens_provider_idx" ON "oauth_refresh_tokens"("provider");

-- AddForeignKey
ALTER TABLE "oauth_refresh_tokens" ADD CONSTRAINT "oauth_refresh_tokens_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
