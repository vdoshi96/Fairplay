-- Existing households intentionally start without a marker so their next
-- overview read performs one safe catalog reconciliation before opting into
-- the version-gated fast path.
ALTER TABLE "Household" ADD COLUMN "catalogVersion" TEXT;
