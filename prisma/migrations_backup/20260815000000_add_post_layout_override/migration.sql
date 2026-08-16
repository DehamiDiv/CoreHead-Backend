ALTER TABLE "Post"
ADD COLUMN "layoutTemplateId" INTEGER;

CREATE INDEX "idx_posts_layout_template"
ON "Post"("layoutTemplateId");

ALTER TABLE "Post"
ADD CONSTRAINT "Post_layoutTemplateId_fkey"
FOREIGN KEY ("layoutTemplateId") REFERENCES "Template"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
