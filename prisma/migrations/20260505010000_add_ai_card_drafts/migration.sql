-- CreateEnum
CREATE TYPE "AiCardDraftStatus" AS ENUM ('processing', 'ready', 'failed', 'accepted', 'canceled');

-- CreateEnum
CREATE TYPE "AiCardGenerationStage" AS ENUM ('queued', 'transcribing', 'structuring', 'generating_image', 'saving_image', 'ready', 'failed');

-- CreateEnum
CREATE TYPE "AiCardSourceInputType" AS ENUM ('text', 'audio');

-- CreateTable
CREATE TABLE "AiCardDraft" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "createdByPersonaId" TEXT NOT NULL,
    "sourceInputType" "AiCardSourceInputType" NOT NULL,
    "inputText" TEXT,
    "audioBytes" BYTEA,
    "audioMimeType" TEXT,
    "audioTranscript" TEXT,
    "status" "AiCardDraftStatus" NOT NULL DEFAULT 'processing',
    "generationStage" "AiCardGenerationStage" NOT NULL DEFAULT 'queued',
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "title" TEXT,
    "summary" TEXT,
    "areaKeys" TEXT[],
    "hiddenEffortKeys" "HiddenEffortKey"[],
    "cadence" "Cadence",
    "definition" TEXT,
    "conception" TEXT,
    "planning" TEXT,
    "execution" TEXT,
    "minimumStandard" TEXT,
    "imagePrompt" TEXT,
    "imageNegativePrompt" TEXT,
    "coverImageBytes" BYTEA,
    "coverImageMimeType" TEXT,
    "acceptedResponsibilityId" TEXT,
    "readyAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "audioDeletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiCardDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiCardDraft_acceptedResponsibilityId_key" ON "AiCardDraft"("acceptedResponsibilityId");

-- CreateIndex
CREATE INDEX "AiCardDraft_householdId_status_createdAt_idx" ON "AiCardDraft"("householdId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "AiCardDraft_createdByPersonaId_idx" ON "AiCardDraft"("createdByPersonaId");

-- AddForeignKey
ALTER TABLE "AiCardDraft" ADD CONSTRAINT "AiCardDraft_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiCardDraft" ADD CONSTRAINT "AiCardDraft_createdByPersonaId_fkey" FOREIGN KEY ("createdByPersonaId") REFERENCES "Persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiCardDraft" ADD CONSTRAINT "AiCardDraft_acceptedResponsibilityId_fkey" FOREIGN KEY ("acceptedResponsibilityId") REFERENCES "Responsibility"("id") ON DELETE SET NULL ON UPDATE CASCADE;
