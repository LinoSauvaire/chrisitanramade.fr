-- AlterTable
ALTER TABLE "featured_works" ADD COLUMN     "seriesId" TEXT;

-- AddForeignKey
ALTER TABLE "featured_works" ADD CONSTRAINT "featured_works_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE SET NULL ON UPDATE CASCADE;