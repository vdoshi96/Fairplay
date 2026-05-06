-- CreateEnum
CREATE TYPE "LittleAlexGenderPresentation" AS ENUM ('neutral', 'masculine', 'feminine');

-- CreateEnum
CREATE TYPE "LittleAlexSkinTone" AS ENUM ('tone_1', 'tone_2', 'tone_3', 'tone_4', 'tone_5');

-- CreateTable
CREATE TABLE "PersonaLittleAlexPreferences" (
    "id" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "genderPresentation" "LittleAlexGenderPresentation" NOT NULL DEFAULT 'neutral',
    "chatPhrase" VARCHAR(30) NOT NULL DEFAULT 'i''m little alex horne',
    "skinTone" "LittleAlexSkinTone" NOT NULL DEFAULT 'tone_2',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonaLittleAlexPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PersonaLittleAlexPreferences_personaId_key" ON "PersonaLittleAlexPreferences"("personaId");

-- AddForeignKey
ALTER TABLE "PersonaLittleAlexPreferences" ADD CONSTRAINT "PersonaLittleAlexPreferences_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;
