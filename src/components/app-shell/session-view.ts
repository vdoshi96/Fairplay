import { headers } from "next/headers";
import { NextRequest } from "next/server";

import type { HouseholdSummary } from "@/contracts/auth";
import type { PersonaSummary } from "@/contracts/personas";
import { getCurrentSession } from "@/server/auth/current-session";
import { findHouseholdSummaryById } from "@/server/repositories/households";
import { listPersonasForHousehold } from "@/server/repositories/personas";

export type AppSessionView = {
  household: HouseholdSummary;
  personas: [PersonaSummary, PersonaSummary];
  selectedPersona: PersonaSummary | null;
  selectedPersonaId: string | null;
};

export async function getAppSessionView(): Promise<AppSessionView | null> {
  const requestHeaders = await headers();
  const request = new NextRequest("http://fairplay.local", {
    headers: requestHeaders
  });
  const session = await getCurrentSession(request);

  if (!session) {
    return null;
  }

  const [household, personas] = await Promise.all([
    findHouseholdSummaryById(session.householdId),
    listPersonasForHousehold(session.householdId)
  ]);

  if (!household) {
    return null;
  }

  return {
    household,
    personas,
    selectedPersona:
      personas.find((persona) => persona.id === session.selectedPersonaId) ?? null,
    selectedPersonaId: session.selectedPersonaId
  };
}
