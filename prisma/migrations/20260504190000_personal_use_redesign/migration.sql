CREATE TYPE "ResponsibilityBoardLane" AS ENUM (
  'cards_of_concern',
  'player_1',
  'player_2',
  'kid_split',
  'not_in_play',
  'trimmed'
);

ALTER TABLE "ResponsibilityTemplate"
  ADD COLUMN "sourceCardId" TEXT,
  ADD COLUMN "definition" TEXT,
  ADD COLUMN "conception" TEXT,
  ADD COLUMN "planning" TEXT,
  ADD COLUMN "execution" TEXT,
  ADD COLUMN "minimumStandard" TEXT,
  ADD COLUMN "coverAssetPath" TEXT,
  ADD COLUMN "defaultLane" "ResponsibilityBoardLane" NOT NULL DEFAULT 'not_in_play',
  ADD COLUMN "sourceVersion" TEXT,
  ADD COLUMN "importedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "ResponsibilityTemplate_sourceCardId_key"
  ON "ResponsibilityTemplate"("sourceCardId");

ALTER TABLE "Responsibility"
  ADD COLUMN "boardLane" "ResponsibilityBoardLane" NOT NULL DEFAULT 'cards_of_concern',
  ADD COLUMN "boardSortOrder" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "sourceDefinition" TEXT,
  ADD COLUMN "sourceConception" TEXT,
  ADD COLUMN "sourcePlanning" TEXT,
  ADD COLUMN "sourceExecution" TEXT,
  ADD COLUMN "sourceMinimumStandard" TEXT,
  ADD COLUMN "sourceCoverAssetPath" TEXT;

CREATE INDEX "Responsibility_householdId_boardLane_boardSortOrder_idx"
  ON "Responsibility"("householdId", "boardLane", "boardSortOrder");

CREATE INDEX "Responsibility_templateId_idx"
  ON "Responsibility"("templateId");

CREATE TABLE "PersonaOnboardingPreferences" (
  "id" TEXT NOT NULL,
  "personaId" TEXT NOT NULL,
  "welcomeDismissedAt" TIMESTAMP(3),
  "crashCourseSkippedAt" TIMESTAMP(3),
  "crashCourseCompletedAt" TIMESTAMP(3),
  "crashCourseCurrentStep" INTEGER NOT NULL DEFAULT 0,
  "crashCourseReplayRequestedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PersonaOnboardingPreferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PersonaOnboardingPreferences_personaId_key"
  ON "PersonaOnboardingPreferences"("personaId");

ALTER TABLE "PersonaOnboardingPreferences"
  ADD CONSTRAINT "PersonaOnboardingPreferences_personaId_fkey"
  FOREIGN KEY ("personaId") REFERENCES "Persona"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
