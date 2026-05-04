import { NextRequest, NextResponse } from "next/server";

import { RadarDeferMutationSchema } from "@/contracts/radar";
import { getCurrentSession } from "@/server/auth/current-session";
import { radarService } from "@/server/radar/service";
import {
  authRequired,
  invalidRequest,
  isRecord,
  parseRadarId,
  readJson,
  serviceErrorResponse,
  type RadarRouteContext
} from "../../route-helpers";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: RadarRouteContext
): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  const radarItemId = await parseRadarId(context);
  if (!radarItemId) {
    return invalidRequest();
  }

  const body = await readJson(request);
  const parsed = RadarDeferMutationSchema.safeParse({
    ...(isRecord(body) ? body : {}),
    id: radarItemId
  });
  if (!parsed.success) {
    return invalidRequest();
  }

  try {
    return NextResponse.json(
      await radarService.defer(session, radarItemId, parsed.data)
    );
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
