-- Remove the retired Radar backend surface while preserving responsibility
-- and check-in records. Existing Radar rows and Radar-linked check-in item
-- references are intentionally dropped with the retired model.

ALTER TABLE "CheckInItem" DROP CONSTRAINT IF EXISTS "CheckInItem_radarItemId_fkey";
ALTER TABLE "RadarItem" DROP CONSTRAINT IF EXISTS "RadarItem_targetCheckInId_fkey";
ALTER TABLE "RadarItem" DROP CONSTRAINT IF EXISTS "RadarItem_createdByPersonaId_fkey";
ALTER TABLE "RadarItem" DROP CONSTRAINT IF EXISTS "RadarItem_responsibilityId_fkey";
ALTER TABLE "RadarItem" DROP CONSTRAINT IF EXISTS "RadarItem_householdId_fkey";

DELETE FROM "CheckInItem" WHERE "itemType" = 'radar';

ALTER TABLE "CheckInItem" DROP COLUMN IF EXISTS "radarItemId";
ALTER TABLE "LoadSnapshot" DROP COLUMN IF EXISTS "radarOpenCount";

DROP TABLE IF EXISTS "RadarItem";

ALTER TYPE "CheckInItemType" RENAME TO "CheckInItemType_old";
CREATE TYPE "CheckInItemType" AS ENUM ('responsibility', 'custom');
ALTER TABLE "CheckInItem"
  ALTER COLUMN "itemType" TYPE "CheckInItemType"
  USING ("itemType"::text::"CheckInItemType");
DROP TYPE "CheckInItemType_old";

DROP TYPE IF EXISTS "RadarReasonKey";
DROP TYPE IF EXISTS "RadarState";
DROP TYPE IF EXISTS "Urgency";
