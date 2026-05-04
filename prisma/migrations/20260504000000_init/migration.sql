-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PersonaKey" AS ENUM ('alex', 'max');

-- CreateEnum
CREATE TYPE "ResponsibilityStatus" AS ENUM ('unassigned', 'active', 'needs_review', 'paused', 'not_relevant', 'archived');

-- CreateEnum
CREATE TYPE "AssignmentRole" AS ENUM ('accountable_owner', 'shared_owner', 'helper', 'backup');

-- CreateEnum
CREATE TYPE "AssignmentScope" AS ENUM ('outcome', 'part', 'support', 'temporary');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('private', 'shared_household', 'partner_visible', 'check_in_only');

-- CreateEnum
CREATE TYPE "Cadence" AS ENUM ('daily', 'weekly', 'monthly', 'seasonal', 'event_based', 'as_needed', 'one_time');

-- CreateEnum
CREATE TYPE "HiddenEffortKey" AS ENUM ('noticing', 'planning', 'doing', 'follow_through', 'emotional_attention');

-- CreateEnum
CREATE TYPE "RadarReasonKey" AS ENUM ('unclear_expectation', 'blocked', 'too_much', 'handoff_needed', 'review_due', 'other');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('low', 'normal', 'soon');

-- CreateEnum
CREATE TYPE "RadarState" AS ENUM ('draft', 'open', 'scheduled', 'discussed', 'resolved', 'dismissed', 'deferred');

-- CreateEnum
CREATE TYPE "CheckInState" AS ENUM ('draft', 'scheduled', 'active', 'completed', 'skipped');

-- CreateEnum
CREATE TYPE "CheckInItemState" AS ENUM ('queued', 'discussed', 'deferred', 'skipped');

-- CreateEnum
CREATE TYPE "CheckInItemType" AS ENUM ('responsibility', 'radar', 'custom');

-- CreateEnum
CREATE TYPE "DecisionType" AS ENUM ('assign_owner', 'change_role', 'change_standard', 'change_cadence', 'pause', 'mark_not_relevant', 'archive', 'schedule_review', 'custom_note');

-- CreateEnum
CREATE TYPE "SourceReviewStatus" AS ENUM ('not_reviewed', 'approved_original', 'blocked', 'needs_review');

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "usernameNormalized" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseholdCredential" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "hashAlgorithm" TEXT NOT NULL,
    "hashParamsVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastRotatedAt" TIMESTAMP(3),

    CONSTRAINT "HouseholdCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Persona" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "key" "PersonaKey" NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "selectedPersonaId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgentHash" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Responsibility" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "createdByPersonaId" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "areaKeys" TEXT[],
    "hiddenEffortKeys" "HiddenEffortKey"[],
    "cadence" "Cadence" NOT NULL,
    "relevantDays" TEXT[],
    "status" "ResponsibilityStatus" NOT NULL,
    "visibility" "Visibility" NOT NULL,
    "householdStandard" TEXT,
    "notes" TEXT,
    "lastReviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Responsibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsibilityAssignment" (
    "id" TEXT NOT NULL,
    "responsibilityId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "role" "AssignmentRole" NOT NULL,
    "scope" "AssignmentScope" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "createdByPersonaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResponsibilityAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsibilityLifecycleNotes" (
    "id" TEXT NOT NULL,
    "responsibilityId" TEXT NOT NULL,
    "noticeDecideNotes" TEXT,
    "planPrepareNotes" TEXT,
    "executeFollowThroughNotes" TEXT,
    "dependencies" TEXT,
    "blockers" TEXT,
    "supportNeeded" TEXT,
    "handoffNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResponsibilityLifecycleNotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsibilityTemplate" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "areaKeys" TEXT[],
    "defaultCadence" "Cadence" NOT NULL,
    "hiddenEffortKeys" "HiddenEffortKey"[],
    "sourceReviewStatus" "SourceReviewStatus" NOT NULL,
    "contentVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResponsibilityTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadarItem" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "responsibilityId" TEXT,
    "createdByPersonaId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "notes" TEXT,
    "reasonKey" "RadarReasonKey" NOT NULL,
    "urgency" "Urgency" NOT NULL,
    "visibility" "Visibility" NOT NULL,
    "state" "RadarState" NOT NULL,
    "targetCheckInId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "RadarItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "state" "CheckInState" NOT NULL,
    "scheduledFor" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "facilitatorPersonaId" TEXT,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckInItem" (
    "id" TEXT NOT NULL,
    "checkInId" TEXT NOT NULL,
    "responsibilityId" TEXT,
    "radarItemId" TEXT,
    "itemType" "CheckInItemType" NOT NULL,
    "state" "CheckInItemState" NOT NULL,
    "promptKey" TEXT NOT NULL,
    "response" TEXT,
    "decisionId" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckInItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "checkInId" TEXT,
    "responsibilityId" TEXT,
    "decisionType" "DecisionType" NOT NULL,
    "summary" TEXT NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "reviewOn" TIMESTAMP(3),
    "createdByPersonaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsibilityEvent" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "responsibilityId" TEXT,
    "actorPersonaId" TEXT,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResponsibilityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoadSnapshot" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL,
    "ownerDistribution" JSONB NOT NULL,
    "sharedDistribution" JSONB NOT NULL,
    "areaDistribution" JSONB NOT NULL,
    "cadenceDistribution" JSONB NOT NULL,
    "reviewDueCount" INTEGER NOT NULL,
    "radarOpenCount" INTEGER NOT NULL,
    "pausedOrNotRelevantCount" INTEGER NOT NULL,
    "hiddenEffortMix" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoadSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthThrottle" (
    "id" TEXT NOT NULL,
    "usernameNormalized" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "failedAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "windowStartedAt" TIMESTAMP(3) NOT NULL,
    "throttledUntil" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthThrottle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Household_usernameNormalized_key" ON "Household"("usernameNormalized");

-- CreateIndex
CREATE UNIQUE INDEX "HouseholdCredential_householdId_key" ON "HouseholdCredential"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "Persona_householdId_key_key" ON "Persona"("householdId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_householdId_idx" ON "Session"("householdId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Responsibility_householdId_idx" ON "Responsibility"("householdId");

-- CreateIndex
CREATE INDEX "Responsibility_status_idx" ON "Responsibility"("status");

-- CreateIndex
CREATE INDEX "ResponsibilityAssignment_responsibilityId_startsAt_idx" ON "ResponsibilityAssignment"("responsibilityId", "startsAt");

-- CreateIndex
CREATE INDEX "ResponsibilityAssignment_personaId_idx" ON "ResponsibilityAssignment"("personaId");

-- CreateIndex
CREATE UNIQUE INDEX "ResponsibilityLifecycleNotes_responsibilityId_key" ON "ResponsibilityLifecycleNotes"("responsibilityId");

-- CreateIndex
CREATE UNIQUE INDEX "ResponsibilityTemplate_slug_key" ON "ResponsibilityTemplate"("slug");

-- CreateIndex
CREATE INDEX "RadarItem_householdId_state_idx" ON "RadarItem"("householdId", "state");

-- CreateIndex
CREATE INDEX "RadarItem_createdByPersonaId_visibility_idx" ON "RadarItem"("createdByPersonaId", "visibility");

-- CreateIndex
CREATE INDEX "CheckIn_householdId_state_idx" ON "CheckIn"("householdId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "CheckInItem_decisionId_key" ON "CheckInItem"("decisionId");

-- CreateIndex
CREATE INDEX "CheckInItem_checkInId_sortOrder_idx" ON "CheckInItem"("checkInId", "sortOrder");

-- CreateIndex
CREATE INDEX "Decision_householdId_idx" ON "Decision"("householdId");

-- CreateIndex
CREATE INDEX "ResponsibilityEvent_householdId_occurredAt_idx" ON "ResponsibilityEvent"("householdId", "occurredAt");

-- CreateIndex
CREATE INDEX "LoadSnapshot_householdId_periodStart_periodEnd_idx" ON "LoadSnapshot"("householdId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "AuthThrottle_throttledUntil_idx" ON "AuthThrottle"("throttledUntil");

-- CreateIndex
CREATE UNIQUE INDEX "AuthThrottle_usernameNormalized_ipHash_key" ON "AuthThrottle"("usernameNormalized", "ipHash");

-- AddForeignKey
ALTER TABLE "HouseholdCredential" ADD CONSTRAINT "HouseholdCredential_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Persona" ADD CONSTRAINT "Persona_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_selectedPersonaId_fkey" FOREIGN KEY ("selectedPersonaId") REFERENCES "Persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_createdByPersonaId_fkey" FOREIGN KEY ("createdByPersonaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsibility" ADD CONSTRAINT "Responsibility_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ResponsibilityTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsibilityAssignment" ADD CONSTRAINT "ResponsibilityAssignment_responsibilityId_fkey" FOREIGN KEY ("responsibilityId") REFERENCES "Responsibility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsibilityAssignment" ADD CONSTRAINT "ResponsibilityAssignment_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsibilityAssignment" ADD CONSTRAINT "ResponsibilityAssignment_createdByPersonaId_fkey" FOREIGN KEY ("createdByPersonaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsibilityLifecycleNotes" ADD CONSTRAINT "ResponsibilityLifecycleNotes_responsibilityId_fkey" FOREIGN KEY ("responsibilityId") REFERENCES "Responsibility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadarItem" ADD CONSTRAINT "RadarItem_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadarItem" ADD CONSTRAINT "RadarItem_responsibilityId_fkey" FOREIGN KEY ("responsibilityId") REFERENCES "Responsibility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadarItem" ADD CONSTRAINT "RadarItem_createdByPersonaId_fkey" FOREIGN KEY ("createdByPersonaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadarItem" ADD CONSTRAINT "RadarItem_targetCheckInId_fkey" FOREIGN KEY ("targetCheckInId") REFERENCES "CheckIn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_facilitatorPersonaId_fkey" FOREIGN KEY ("facilitatorPersonaId") REFERENCES "Persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInItem" ADD CONSTRAINT "CheckInItem_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "CheckIn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInItem" ADD CONSTRAINT "CheckInItem_responsibilityId_fkey" FOREIGN KEY ("responsibilityId") REFERENCES "Responsibility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInItem" ADD CONSTRAINT "CheckInItem_radarItemId_fkey" FOREIGN KEY ("radarItemId") REFERENCES "RadarItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckInItem" ADD CONSTRAINT "CheckInItem_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "CheckIn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_responsibilityId_fkey" FOREIGN KEY ("responsibilityId") REFERENCES "Responsibility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_createdByPersonaId_fkey" FOREIGN KEY ("createdByPersonaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsibilityEvent" ADD CONSTRAINT "ResponsibilityEvent_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsibilityEvent" ADD CONSTRAINT "ResponsibilityEvent_responsibilityId_fkey" FOREIGN KEY ("responsibilityId") REFERENCES "Responsibility"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsibilityEvent" ADD CONSTRAINT "ResponsibilityEvent_actorPersonaId_fkey" FOREIGN KEY ("actorPersonaId") REFERENCES "Persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadSnapshot" ADD CONSTRAINT "LoadSnapshot_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

