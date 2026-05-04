import { NextRequest, NextResponse } from "next/server";

import { getCurrentSession } from "@/server/auth/current-session";
import { responsibilityService } from "@/server/responsibilities/service";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  try {
    const overview = await responsibilityService.listOverview(session);

    return NextResponse.json(overview.loadSnapshot);
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

function authRequired() {
  return NextResponse.json(
    { error: "Authentication required." },
    { status: 401 }
  );
}

function serviceErrorResponse(error: unknown): NextResponse {
  const code =
    error && typeof error === "object" && "code" in error ? error.code : null;

  if (code === "AUTH_REQUIRED") {
    return authRequired();
  }

  throw error;
}
