-- CreateTable
CREATE TABLE "homepages" (
    "id" TEXT NOT NULL,
    "heroImageUrl" TEXT,
    "heroImageKey" TEXT,
    "heroText" TEXT NOT NULL DEFAULT '',
    "presentation" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homepages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "featured_works" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "homepageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "featured_works_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "featured_works" ADD CONSTRAINT "featured_works_homepageId_fkey" FOREIGN KEY ("homepageId") REFERENCES "homepages"("id") ON DELETE CASCADE ON UPDATE CASCADE;