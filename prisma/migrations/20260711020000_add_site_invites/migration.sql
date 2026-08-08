-- R1-3: Site team invites
CREATE TABLE IF NOT EXISTS "site_invites" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'EDITOR',
    "token" VARCHAR(64) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "invitedBy" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(6) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "site_invites_token_key" ON "site_invites"("token");
CREATE INDEX IF NOT EXISTS "idx_site_invites_site" ON "site_invites"("siteId");
CREATE INDEX IF NOT EXISTS "idx_site_invites_email" ON "site_invites"("email");
CREATE INDEX IF NOT EXISTS "idx_site_invites_status" ON "site_invites"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'site_invites_siteId_fkey'
  ) THEN
    ALTER TABLE "site_invites"
      ADD CONSTRAINT "site_invites_siteId_fkey"
      FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'site_invites_invitedBy_fkey'
  ) THEN
    ALTER TABLE "site_invites"
      ADD CONSTRAINT "site_invites_invitedBy_fkey"
      FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
