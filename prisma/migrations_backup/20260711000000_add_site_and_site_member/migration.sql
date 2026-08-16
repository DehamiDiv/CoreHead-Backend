-- T1: Multi-tenant Site model + membership
-- Sites table: one workspace/website per owner (slug unique platform-wide)
CREATE TABLE IF NOT EXISTS "sites" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "logo" VARCHAR(500),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "sites_slug_key" ON "sites"("slug");
CREATE INDEX IF NOT EXISTS "idx_sites_owner" ON "sites"("ownerId");
CREATE INDEX IF NOT EXISTS "idx_sites_status" ON "sites"("status");

-- Site members: per-site roles (OWNER | EDITOR | AUTHOR)
CREATE TABLE IF NOT EXISTS "site_members" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_site_members_site_user" ON "site_members"("siteId", "userId");
CREATE INDEX IF NOT EXISTS "idx_site_members_user" ON "site_members"("userId");
CREATE INDEX IF NOT EXISTS "idx_site_members_site" ON "site_members"("siteId");

-- Foreign keys (users table is mapped as "users")
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sites_ownerId_fkey'
    ) THEN
        ALTER TABLE "sites"
            ADD CONSTRAINT "sites_ownerId_fkey"
            FOREIGN KEY ("ownerId") REFERENCES "users"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'site_members_siteId_fkey'
    ) THEN
        ALTER TABLE "site_members"
            ADD CONSTRAINT "site_members_siteId_fkey"
            FOREIGN KEY ("siteId") REFERENCES "sites"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'site_members_userId_fkey'
    ) THEN
        ALTER TABLE "site_members"
            ADD CONSTRAINT "site_members_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
