-- Keep one active household responsibility per catalog template.
-- Duplicate rows are archived, not deleted, and only rows with the same
-- household/template identity are considered duplicates.
WITH ranked_catalog_cards AS (
  SELECT
    r."id",
    ROW_NUMBER() OVER (
      PARTITION BY r."householdId", r."templateId"
      ORDER BY
        CASE WHEN r."archivedAt" IS NULL THEN 0 ELSE 1 END,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM "ResponsibilityAssignment" a
            WHERE a."responsibilityId" = r."id"
              AND a."endsAt" IS NULL
              AND a."role" IN ('accountable_owner', 'shared_owner')
          ) THEN 0
          WHEN r."boardLane" IN ('player_1', 'player_2') THEN 1
          WHEN r."status" IN ('paused', 'not_relevant')
            OR r."boardLane" IN ('not_in_play', 'trimmed') THEN 2
          WHEN r."status" IN ('active', 'needs_review') THEN 3
          ELSE 4
        END,
        r."updatedAt" DESC,
        r."createdAt" ASC,
        r."id" ASC
    ) AS rank
  FROM "Responsibility" r
  WHERE r."templateId" IS NOT NULL
)
UPDATE "Responsibility"
SET
  "archivedAt" = COALESCE("archivedAt", NOW()),
  "status" = 'archived',
  "updatedAt" = NOW()
WHERE "id" IN (
  SELECT "id"
  FROM ranked_catalog_cards
  WHERE rank > 1
);

CREATE UNIQUE INDEX "Responsibility_householdId_templateId_active_key"
  ON "Responsibility"("householdId", "templateId")
  WHERE "templateId" IS NOT NULL
    AND "archivedAt" IS NULL;
