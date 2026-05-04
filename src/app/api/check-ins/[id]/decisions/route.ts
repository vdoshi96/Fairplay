import { NextRequest, NextResponse } from "next/server";
import { CheckInItemIdSchema } from "@/domain/ids";
import { getCurrentSession } from "@/server/auth/current-session";
import {
  checkInService,
  GuidedDecisionInputSchema,
  parseCheckInId
} from "@/server/check-ins/service";
import {
  authRequired,
  invalidRequest,
  readJson,
  serviceErrorResponse,
  type CheckInRouteContext
} from "../../route-helpers";

export const runtime = "nodejs";

const DecisionRequestSchema = GuidedDecisionInputSchema.extend({
  itemId: CheckInItemIdSchema
}).strict();

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
  const parsed = DecisionRequestSchema.safeParse(await readJson(request));
  if (!checkInId || !parsed.success) {
    return invalidRequest();
  }

  const { itemId, ...decision } = parsed.data;

  try {
    return NextResponse.json(
      await checkInService.recordDecision(session, checkInId, itemId, decision),
      { status: 201 }
    );
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
