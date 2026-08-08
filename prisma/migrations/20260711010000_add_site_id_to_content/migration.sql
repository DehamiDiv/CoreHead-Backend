-- T2: Scope content by siteId (multi-tenant isolation)

-- Posts
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "siteId" INTEGER;
DROP INDEX IF EXISTS "Post_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "uq_posts_site_slug" ON "Post"("siteId", "slug");
CREATE INDEX IF NOT EXISTS "idx_posts_site" ON "Post"("siteId");

-- Categories: drop global uniques, add per-site uniques
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "siteId" INTEGER;
ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_name_key";
ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "uq_categories_site_slug" ON "categories"("siteId", "slug");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_categories_site_name" ON "categories"("siteId", "name");
CREATE INDEX IF NOT EXISTS "idx_categories_site" ON "categories"("siteId");

-- Media
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "siteId" INTEGER;
CREATE INDEX IF NOT EXISTS "idx_media_site" ON "media"("siteId");

-- Templates
ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "siteId" INTEGER;
CREATE INDEX IF NOT EXISTS "idx_templates_site" ON "Template"("siteId");

-- Settings: drop global key unique, add per-site unique
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "siteId" INTEGER;
ALTER TABLE "settings" DROP CONSTRAINT IF EXISTS "settings_key_key";
CREATE UNIQUE INDEX IF NOT EXISTS "uq_settings_site_key" ON "settings"("siteId", "key");
CREATE INDEX IF NOT EXISTS "idx_settings_site" ON "settings"("siteId");

-- Bindings
ALTER TABLE "Binding" ADD COLUMN IF NOT EXISTS "siteId" INTEGER;
CREATE INDEX IF NOT EXISTS "idx_bindings_site" ON "Binding"("siteId");

-- Page layouts
ALTER TABLE "PageLayout" ADD COLUMN IF NOT EXISTS "siteId" INTEGER;
ALTER TABLE "PageLayout" DROP CONSTRAINT IF EXISTS "PageLayout_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "uq_page_layouts_site_slug" ON "PageLayout"("siteId", "slug");
CREATE INDEX IF NOT EXISTS "idx_page_layouts_site" ON "PageLayout"("siteId");

-- Builder layouts
ALTER TABLE "builder_layouts" ADD COLUMN IF NOT EXISTS "site_id" INTEGER;
CREATE INDEX IF NOT EXISTS "idx_builder_layouts_site" ON "builder_layouts"("site_id");

-- AI layouts
ALTER TABLE "ai_layouts" ADD COLUMN IF NOT EXISTS "site_id" INTEGER;
CREATE INDEX IF NOT EXISTS "idx_ai_layouts_site" ON "ai_layouts"("site_id");

-- Foreign keys to sites
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Post_siteId_fkey') THEN
    ALTER TABLE "Post" ADD CONSTRAINT "Post_siteId_fkey"
      FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_siteId_fkey') THEN
    ALTER TABLE "categories" ADD CONSTRAINT "categories_siteId_fkey"
      FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'media_siteId_fkey') THEN
    ALTER TABLE "media" ADD CONSTRAINT "media_siteId_fkey"
      FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Template_siteId_fkey') THEN
    ALTER TABLE "Template" ADD CONSTRAINT "Template_siteId_fkey"
      FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'settings_siteId_fkey') THEN
    ALTER TABLE "settings" ADD CONSTRAINT "settings_siteId_fkey"
      FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Binding_siteId_fkey') THEN
    ALTER TABLE "Binding" ADD CONSTRAINT "Binding_siteId_fkey"
      FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PageLayout_siteId_fkey') THEN
    ALTER TABLE "PageLayout" ADD CONSTRAINT "PageLayout_siteId_fkey"
      FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'builder_layouts_site_id_fkey') THEN
    ALTER TABLE "builder_layouts" ADD CONSTRAINT "builder_layouts_site_id_fkey"
      FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_layouts_site_id_fkey') THEN
    ALTER TABLE "ai_layouts" ADD CONSTRAINT "ai_layouts_site_id_fkey"
      FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
