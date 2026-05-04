import { NextRequest, NextResponse } from "next/server";

import { SelectPersonaRequestSchema } from "@/contracts/auth";
import { getCurrentSession } from "@/server/auth/current-session";
import { RepositoryError } from "@/server/db/errors";
import { selectSessionPersona } from "@/server/repositories/sessions";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const parsed = SelectPersonaRequestSchema.safeParse(await readJson(request));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const response = await selectSessionPersona({
      sessionId: session.id,
      householdId: session.householdId,
      selectedPersonaId: parsed.data.personaId
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof RepositoryError && error.code === "INVALID_INPUT") {
      return NextResponse.json(
        { error: "Persona is not available for this household." },
        { status: 403 }
      );
    }

    throw error;
  }
}

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
