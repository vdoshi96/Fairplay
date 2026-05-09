ALTER TABLE "PersonaLittleAlexPreferences"
  ALTER COLUMN "chatPhrase" SET DEFAULT 'Help!';

UPDATE "PersonaLittleAlexPreferences"
SET "chatPhrase" = 'Help!'
WHERE "chatPhrase" = 'i''m little alex horne';
