import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { CheckInIdSchema } from "@/domain/ids";
import { getCurrentSession } from "@/server/auth/current-session";
import { radarService } from "@/server/radar/service";
import {
  authRequired,
  invalidRequest,
  parseRadarId,
  readJson,
  serviceErrorResponse,
  type RadarRouteContext
} from "../../route-helpers";

export const runtime = "nodejs";

const RadarScheduleMutationSchema = z
  .object({
    targetCheckInId: CheckInIdSchema.nullable().optional()
  })
  .strict();

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

  const parsed = RadarScheduleMutationSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return invalidRequest();
  }

  try {
    return NextResponse.json(
      await radarService.schedule(session, radarItemId, parsed.data)
    );
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
