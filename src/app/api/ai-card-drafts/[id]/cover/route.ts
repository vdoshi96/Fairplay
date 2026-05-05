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

const SAFE_COVER_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif"
]);

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
    if (!SAFE_COVER_MIME_TYPES.has(cover.mimeType)) {
      return invalidRequest();
    }

    const bytes =
      cover.bytes instanceof Buffer ? cover.bytes : Buffer.from(cover.bytes);
    const body = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    );

    return new Response(body, {
      headers: {
        "cache-control": "private, no-store",
        "content-type": cover.mimeType,
        "x-content-type-options": "nosniff"
      }
    });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
