-- R3-1: Site-scoped custom HTML pages
CREATE TABLE IF NOT EXISTS "pages" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(150) NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Draft',
    "siteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_pages_site_slug" ON "pages"("siteId", "slug");
CREATE INDEX IF NOT EXISTS "idx_pages_site" ON "pages"("siteId");
CREATE INDEX IF NOT EXISTS "idx_pages_status" ON "pages"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pages_siteId_fkey'
  ) THEN
    ALTER TABLE "pages"
      ADD CONSTRAINT "pages_siteId_fkey"
      FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
