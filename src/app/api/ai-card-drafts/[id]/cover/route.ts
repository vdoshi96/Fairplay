import { NextRequest } from "next/server";

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

export async function GET(
  request: NextRequest,
  context: AiCardDraftRouteContext
): Promise<Response> {
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  const draftId = await parseAiCardDraftId(context);
  if (!draftId) {
    return invalidRequest();
  }

  try {
    const cover = await aiCardDraftService.getCover(session, draftId);
    const bytes =
      cover.bytes instanceof Buffer ? cover.bytes : Buffer.from(cover.bytes);
    const body = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    );

    return new Response(body, {
      headers: {
        "content-type": cover.mimeType
      }
    });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
