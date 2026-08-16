-- R6: custom domain + plan/billing fields on sites
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "customDomain" VARCHAR(255);
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "domainStatus" VARCHAR(20) NOT NULL DEFAULT 'unconfigured';
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "domainVerifyToken" VARCHAR(64);
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "plan" VARCHAR(20) NOT NULL DEFAULT 'free';
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "planStatus" VARCHAR(20) NOT NULL DEFAULT 'active';
ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "planUpdatedAt" TIMESTAMP(6);

CREATE UNIQUE INDEX IF NOT EXISTS "sites_customDomain_key" ON "sites"("customDomain");
CREATE INDEX IF NOT EXISTS "idx_sites_custom_domain" ON "sites"("customDomain");
