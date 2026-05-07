import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { ResponsibilityIdSchema } from "@/domain/ids";
import { getCurrentSession } from "@/server/auth/current-session";
import { MAX_AGENDA_ITEMS } from "@/server/check-ins/agenda";
import { checkInService } from "@/server/check-ins/service";
import {
  authRequired,
  invalidRequest,
  readJson,
  serviceErrorResponse
} from "../route-helpers";

export const runtime = "nodejs";

const PreviewCheckInSchema = z
  .object({
    maxItems: z.number().int().min(1).max(MAX_AGENDA_ITEMS).optional(),
    responsibilityIds: z.array(ResponsibilityIdSchema).optional(),
    includeAcknowledgement: z.boolean().optional()
  })
  .strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  const parsed = PreviewCheckInSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return invalidRequest();
  }

  try {
    return NextResponse.json(await checkInService.preview(session, parsed.data));
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
