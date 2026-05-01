-- CreateEnum
CREATE TYPE "OldPortalXmlImportStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "OldPortalXmlImport" (
    "id" TEXT NOT NULL,
    "xmlFilename" TEXT NOT NULL,
    "s3Url" TEXT NOT NULL,
    "status" "OldPortalXmlImportStatus" NOT NULL,
    "errorMessage" TEXT,
    "triggeredBy" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "OldPortalXmlImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OldPortalXmlImport_xmlFilename_startedAt_idx" ON "OldPortalXmlImport"("xmlFilename", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "OldPortalXmlImport_status_startedAt_idx" ON "OldPortalXmlImport"("status", "startedAt" DESC);
