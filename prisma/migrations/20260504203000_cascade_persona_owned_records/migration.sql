ALTER TABLE "Responsibility"
  DROP CONSTRAINT "Responsibility_createdByPersonaId_fkey",
  ADD CONSTRAINT "Responsibility_createdByPersonaId_fkey"
  FOREIGN KEY ("createdByPersonaId") REFERENCES "Persona"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ResponsibilityAssignment"
  DROP CONSTRAINT "ResponsibilityAssignment_personaId_fkey",
  ADD CONSTRAINT "ResponsibilityAssignment_personaId_fkey"
  FOREIGN KEY ("personaId") REFERENCES "Persona"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ResponsibilityAssignment"
  DROP CONSTRAINT "ResponsibilityAssignment_createdByPersonaId_fkey",
  ADD CONSTRAINT "ResponsibilityAssignment_createdByPersonaId_fkey"
  FOREIGN KEY ("createdByPersonaId") REFERENCES "Persona"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RadarItem"
  DROP CONSTRAINT "RadarItem_createdByPersonaId_fkey",
  ADD CONSTRAINT "RadarItem_createdByPersonaId_fkey"
  FOREIGN KEY ("createdByPersonaId") REFERENCES "Persona"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Decision"
  DROP CONSTRAINT "Decision_createdByPersonaId_fkey",
  ADD CONSTRAINT "Decision_createdByPersonaId_fkey"
  FOREIGN KEY ("createdByPersonaId") REFERENCES "Persona"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
