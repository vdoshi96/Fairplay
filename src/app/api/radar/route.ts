import { NextRequest, NextResponse } from "next/server";

import { RadarCreateSchema } from "@/contracts/radar";
import { getCurrentSession } from "@/server/auth/current-session";
import { radarService } from "@/server/radar/service";
import {
  authRequired,
  invalidRequest,
  readJson,
  serviceErrorResponse
} from "./route-helpers";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  try {
    return NextResponse.json(await radarService.list(session));
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  const parsed = RadarCreateSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return invalidRequest();
  }

  try {
    const created = await radarService.create(session, parsed.data);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
