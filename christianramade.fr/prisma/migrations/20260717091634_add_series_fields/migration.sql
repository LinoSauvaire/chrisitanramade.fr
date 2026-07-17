-- AlterTable
ALTER TABLE "series" ADD COLUMN     "description" TEXT,
ADD COLUMN     "shootDate" TIMESTAMP(3),
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "visibility" TEXT NOT NULL DEFAULT 'private';
