import { NextRequest, NextResponse } from "next/server";

import { AiCardReuseCandidateSearchSchema } from "@/contracts/ai-card-drafts";
import { getCurrentSession } from "@/server/auth/current-session";
import { aiCardDraftService } from "@/server/ai-card-drafts/service";
import {
  authRequired,
  invalidRequest,
  readJson,
  serviceErrorResponse
} from "../route-helpers";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  const parsed = AiCardReuseCandidateSearchSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return invalidRequest();
  }

  try {
    return NextResponse.json(
      await aiCardDraftService.reuseCandidates(session, parsed.data)
    );
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
