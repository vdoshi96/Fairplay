import { NextRequest, NextResponse } from "next/server";

import { RadarUpdateSchema } from "@/contracts/radar";
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
} from "../route-helpers";

export const runtime = "nodejs";

export async function GET(
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

  try {
    return NextResponse.json(await radarService.get(session, radarItemId));
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

export async function PATCH(
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
  const parsed = RadarUpdateSchema.safeParse({
    ...(isRecord(body) ? body : {}),
    id: radarItemId
  });
  if (!parsed.success) {
    return invalidRequest();
  }

  const { id, ...update } = parsed.data;
  if (id !== radarItemId) {
    return invalidRequest();
  }

  try {
    return NextResponse.json(
      await radarService.update(session, radarItemId, update)
    );
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
