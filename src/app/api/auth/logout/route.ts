import { NextRequest, NextResponse } from "next/server";

import { clearSessionCookie } from "@/server/auth/cookies";
import { getCurrentSession } from "@/server/auth/current-session";
import { revokeSession } from "@/server/repositories/sessions";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getCurrentSession(request);
  const response = NextResponse.json({ ok: true });

  if (session) {
    await revokeSession({
      householdId: session.householdId,
      sessionId: session.id
    });
  }

  clearSessionCookie(response);

  return response;
}
