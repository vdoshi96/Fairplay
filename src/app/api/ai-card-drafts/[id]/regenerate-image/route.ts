import { NextRequest, NextResponse } from "next/server";

import { getCurrentSession } from "@/server/auth/current-session";
import {
  authRequired,
  invalidRequest,
  parseAiCardDraftId,
  type AiCardDraftRouteContext
} from "../../route-helpers";

export const runtime = "nodejs";

export async function POST(
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

  return NextResponse.json(
    { error: "Image regeneration is unavailable for text-only card generation." },
    { status: 410 }
  );
}
