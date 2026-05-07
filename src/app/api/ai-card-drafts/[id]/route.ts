import { NextRequest, NextResponse } from "next/server";

import { AiCardDraftUpdateSchema } from "@/contracts/ai-card-drafts";
import { getCurrentSession } from "@/server/auth/current-session";
import { aiCardDraftService } from "@/server/ai-card-drafts/service";
import {
  authRequired,
  invalidRequest,
  parseAiCardDraftId,
  readJson,
  serviceErrorResponse,
  type AiCardDraftRouteContext
} from "../route-helpers";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: AiCardDraftRouteContext
): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  const draftId = await parseAiCardDraftId(context);
  if (!draftId) {
    return invalidRequest();
  }

  try {
    return NextResponse.json(await aiCardDraftService.get(session, draftId));
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: AiCardDraftRouteContext
): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  const draftId = await parseAiCardDraftId(context);
  if (!draftId) {
    return invalidRequest();
  }

  const parsed = AiCardDraftUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return invalidRequest();
  }

  try {
    return NextResponse.json(
      await aiCardDraftService.update(session, draftId, parsed.data)
    );
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: AiCardDraftRouteContext
): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  const draftId = await parseAiCardDraftId(context);
  if (!draftId) {
    return invalidRequest();
  }

  try {
    await aiCardDraftService.discard(session, draftId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
