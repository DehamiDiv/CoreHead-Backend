-- Avatar was VarChar(500); base64 data-URLs and long media URLs overflowed and
-- caused: "The provided value for the column is too long for the column's type"
ALTER TABLE "users" ALTER COLUMN "avatar" SET DATA TYPE TEXT;
