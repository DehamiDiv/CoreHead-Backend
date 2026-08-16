ALTER TABLE "ai_layouts"
ADD COLUMN "promoted_template_id" INTEGER;

CREATE UNIQUE INDEX "ai_layouts_promoted_template_id_key"
ON "ai_layouts"("promoted_template_id");

CREATE INDEX "idx_ai_layouts_promoted_template"
ON "ai_layouts"("promoted_template_id");

ALTER TABLE "ai_layouts"
ADD CONSTRAINT "ai_layouts_promoted_template_id_fkey"
FOREIGN KEY ("promoted_template_id") REFERENCES "Template"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
