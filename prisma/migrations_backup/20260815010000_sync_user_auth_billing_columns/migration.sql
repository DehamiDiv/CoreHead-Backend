-- Keep existing installations aligned with the current User model.
-- IF NOT EXISTS makes this safe for databases that already received some of
-- these columns through an earlier manual schema update.
ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL DEFAULT 'local',
    ADD COLUMN IF NOT EXISTS "providerId" TEXT,
    ADD COLUMN IF NOT EXISTS "subscription_status" TEXT NOT NULL DEFAULT 'FREE',
    ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT,
    ADD COLUMN IF NOT EXISTS "ai_credits" INTEGER NOT NULL DEFAULT 5,
    ADD COLUMN IF NOT EXISTS "ai_credits_used" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "last_credits_reset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Passwords are optional for accounts authenticated by an external provider.
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
