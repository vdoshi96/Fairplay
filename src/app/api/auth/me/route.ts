import { NextRequest, NextResponse } from "next/server";

import { getCurrentSession } from "@/server/auth/current-session";
import { findHouseholdSummaryById } from "@/server/repositories/households";
import { listPersonasForHousehold } from "@/server/repositories/personas";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const [household, personas] = await Promise.all([
    findHouseholdSummaryById(session.householdId),
    listPersonasForHousehold(session.householdId)
  ]);

  if (!household) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const selectedPersona =
    personas.find((persona) => persona.id === session.selectedPersonaId) ?? null;

  return NextResponse.json({
    authenticated: true,
    household,
    personas,
    selectedPersonaId: session.selectedPersonaId,
    selectedPersona
  });
}
