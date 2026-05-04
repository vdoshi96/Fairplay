import type { Persona, PersonaKey } from "@prisma/client";

import type { PersonaSummary } from "../../contracts/personas";
import type { HouseholdId, PersonaId } from "../../domain/ids";
import { prisma } from "../db/prisma";

export function toPersonaSummary(persona: Persona): PersonaSummary {
  return {
    id: persona.id,
    key: persona.key,
    displayName: persona.displayName,
    ...(persona.avatarKey ? { avatarKey: persona.avatarKey } : {})
  };
}

export async function listPersonasForHousehold(
  householdId: HouseholdId
): Promise<[PersonaSummary, PersonaSummary]> {
  const personas = await prisma.persona.findMany({
    where: {
      householdId
    },
    orderBy: {
      key: "asc"
    }
  });
  const ordered = personas.sort((left, right) =>
    left.key === "alex" && right.key === "max" ? -1 : 1
  );

  if (ordered.length !== 2) {
    throw new Error(`Expected exactly two personas for household ${householdId}.`);
  }

  return [toPersonaSummary(ordered[0]), toPersonaSummary(ordered[1])];
}

export async function getPersonaByKey(input: {
  householdId: HouseholdId;
  key: PersonaKey;
}): Promise<PersonaSummary | null> {
  const persona = await prisma.persona.findUnique({
    where: {
      householdId_key: input
    }
  });

  return persona ? toPersonaSummary(persona) : null;
}

export async function personaBelongsToHousehold(input: {
  householdId: HouseholdId;
  personaId: PersonaId;
}): Promise<boolean> {
  const count = await prisma.persona.count({
    where: {
      id: input.personaId,
      householdId: input.householdId
    }
  });

  return count === 1;
}
