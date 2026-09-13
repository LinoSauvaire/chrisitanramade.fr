-- AlterTable
ALTER TABLE "photos" ADD COLUMN     "caption" TEXT,
ADD COLUMN     "year" TEXT,
ADD COLUMN     "variants" JSONB;