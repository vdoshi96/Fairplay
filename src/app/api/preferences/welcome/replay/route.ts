import { NextRequest, NextResponse } from "next/server";

import { getCurrentSession } from "@/server/auth/current-session";
import { replayWelcome } from "@/server/repositories/preferences";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session?.selectedPersonaId) {
    return authRequired();
  }

  return NextResponse.json(await replayWelcome(session.selectedPersonaId));
}

function authRequired() {
  return NextResponse.json(
    { error: "Authentication required." },
    { status: 401 }
  );
}
