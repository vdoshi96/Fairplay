CREATE TYPE "LittleAlexHairColor" AS ENUM ('dark_brown', 'black', 'auburn', 'blonde', 'silver');

ALTER TABLE "PersonaLittleAlexPreferences"
ADD COLUMN "hairColor" "LittleAlexHairColor" NOT NULL DEFAULT 'dark_brown';
