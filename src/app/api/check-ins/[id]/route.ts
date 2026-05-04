import { NextRequest, NextResponse } from "next/server";

import { getCurrentSession } from "@/server/auth/current-session";
import { checkInService, parseCheckInId } from "@/server/check-ins/service";
import {
  authRequired,
  invalidRequest,
  serviceErrorResponse,
  type CheckInRouteContext
} from "../route-helpers";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: CheckInRouteContext
): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  const params = await context.params;
  const checkInId = parseCheckInId(params.id);
  if (!checkInId) {
    return invalidRequest();
  }

  try {
    return NextResponse.json(await checkInService.get(session, checkInId));
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
