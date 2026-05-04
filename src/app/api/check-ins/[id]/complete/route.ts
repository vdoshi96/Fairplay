import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { IsoDateTimeSchema } from "@/domain/time";
import { getCurrentSession } from "@/server/auth/current-session";
import { checkInService, parseCheckInId } from "@/server/check-ins/service";
import {
  authRequired,
  invalidRequest,
  readJson,
  serviceErrorResponse,
  type CheckInRouteContext
} from "../../route-helpers";

export const runtime = "nodejs";

const CompleteSchema = z
  .object({
    completedAt: IsoDateTimeSchema,
    summary: z.string().trim().max(2000).nullable().optional()
  })
  .strict();

export async function POST(
  request: NextRequest,
  context: CheckInRouteContext
): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  const params = await context.params;
  const checkInId = parseCheckInId(params.id);
  const parsed = CompleteSchema.safeParse(await readJson(request));
  if (!checkInId || !parsed.success) {
    return invalidRequest();
  }

  try {
    return NextResponse.json(
      await checkInService.complete(session, checkInId, parsed.data)
    );
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
