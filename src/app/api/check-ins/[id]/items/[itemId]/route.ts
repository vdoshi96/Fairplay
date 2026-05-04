import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { CheckInItemStateSchema } from "@/domain/enums";
import { getCurrentSession } from "@/server/auth/current-session";
import {
  checkInService,
  parseCheckInId,
  parseCheckInItemId
} from "@/server/check-ins/service";
import {
  authRequired,
  invalidRequest,
  readJson,
  serviceErrorResponse,
  type CheckInItemRouteContext
} from "../../../route-helpers";

export const runtime = "nodejs";

const ItemUpdateSchema = z
  .object({
    state: CheckInItemStateSchema,
    response: z.string().trim().max(2000).nullable().optional()
  })
  .strict();

export async function PATCH(
  request: NextRequest,
  context: CheckInItemRouteContext
): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  const params = await context.params;
  const checkInId = parseCheckInId(params.id);
  const itemId = parseCheckInItemId(params.itemId);
  const parsed = ItemUpdateSchema.safeParse(await readJson(request));
  if (!checkInId || !itemId || !parsed.success) {
    return invalidRequest();
  }

  try {
    return NextResponse.json(
      await checkInService.updateItem(session, checkInId, itemId, parsed.data)
    );
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
