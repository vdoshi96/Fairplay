import { NextRequest, NextResponse } from "next/server";

import { createAiRequestDiagnostics } from "@/server/ai/diagnostics";
import { getCurrentSession } from "@/server/auth/current-session";
import { aiCardDraftService } from "@/server/ai-card-drafts/service";
import {
  authRequired,
  invalidRequest,
  parseAiCardDraftId,
  serviceErrorResponse,
  type AiCardDraftRouteContext
} from "../../route-helpers";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: AiCardDraftRouteContext
): Promise<NextResponse> {
  const diagnostics = createAiRequestDiagnostics({
    route: "/api/ai-card-drafts/[id]/regenerate-image"
  });
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  const draftId = await parseAiCardDraftId(context);
  if (!draftId) {
    return invalidRequest();
  }

  try {
    return NextResponse.json(
      await aiCardDraftService.regenerateImage(session, draftId, diagnostics)
    );
  } catch (error) {
    return serviceErrorResponse(error, diagnostics);
  }
}
