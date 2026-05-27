-- Shared generated-card library used by Ask Greg reuse before calling generation.
CREATE TABLE "GeneratedCardLibraryEntry" (
    "id" TEXT NOT NULL,
    "sourceDraftId" TEXT,
    "sourceResponsibilityId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "areaKeys" TEXT[],
    "hiddenEffortKeys" "HiddenEffortKey"[],
    "cadence" "Cadence" NOT NULL,
    "definition" TEXT NOT NULL,
    "conception" TEXT NOT NULL,
    "planning" TEXT NOT NULL,
    "execution" TEXT NOT NULL,
    "minimumStandard" TEXT NOT NULL,
    "sourceCoverAssetPath" TEXT,
    "searchText" TEXT NOT NULL,
    "reuseCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedCardLibraryEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GeneratedCardLibraryEntry_sourceDraftId_key" ON "GeneratedCardLibraryEntry"("sourceDraftId");

CREATE UNIQUE INDEX "GeneratedCardLibraryEntry_sourceResponsibilityId_key" ON "GeneratedCardLibraryEntry"("sourceResponsibilityId");

CREATE INDEX "GeneratedCardLibraryEntry_createdAt_idx" ON "GeneratedCardLibraryEntry"("createdAt");

CREATE INDEX "GeneratedCardLibraryEntry_reuseCount_idx" ON "GeneratedCardLibraryEntry"("reuseCount");
