import { NextRequest, NextResponse } from "next/server";

import { LittleAlexPreferencesMutationSchema } from "@/contracts/preferences";
import { getCurrentSession } from "@/server/auth/current-session";
import {
  getLittleAlexPreferences,
  updateLittleAlexPreferences
} from "@/server/repositories/preferences";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session?.selectedPersonaId) {
    return authRequired();
  }

  return NextResponse.json(
    await getLittleAlexPreferences(session.selectedPersonaId)
  );
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session?.selectedPersonaId) {
    return authRequired();
  }

  const parsed = LittleAlexPreferencesMutationSchema.safeParse(
    await readJson(request)
  );
  if (!parsed.success) {
    return invalidRequest();
  }

  return NextResponse.json(
    await updateLittleAlexPreferences(session.selectedPersonaId, parsed.data)
  );
}

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function authRequired() {
  return NextResponse.json(
    { error: "Authentication required." },
    { status: 401 }
  );
}

function invalidRequest() {
  return NextResponse.json({ error: "Invalid request." }, { status: 400 });
}
