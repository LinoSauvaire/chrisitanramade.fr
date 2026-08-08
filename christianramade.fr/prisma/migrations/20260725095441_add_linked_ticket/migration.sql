-- AlterTable
ALTER TABLE "series" ADD COLUMN     "linkedTicketId" TEXT;

-- AddForeignKey
ALTER TABLE "series" ADD CONSTRAINT "series_linkedTicketId_fkey" FOREIGN KEY ("linkedTicketId") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
