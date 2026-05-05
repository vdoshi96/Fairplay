import { NextRequest, NextResponse } from "next/server";

import { OnboardingPreferencesMutationSchema } from "@/contracts/preferences";
import { getCurrentSession } from "@/server/auth/current-session";
import {
  getOnboardingPreferences,
  updateOnboardingPreferences
} from "@/server/repositories/preferences";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session?.selectedPersonaId) {
    return authRequired();
  }

  return NextResponse.json(
    await getOnboardingPreferences(session.selectedPersonaId)
  );
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session?.selectedPersonaId) {
    return authRequired();
  }

  const parsed = OnboardingPreferencesMutationSchema.safeParse(
    await readJson(request)
  );
  if (!parsed.success) {
    return invalidRequest();
  }

  return NextResponse.json(
    await updateOnboardingPreferences(session.selectedPersonaId, parsed.data)
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
