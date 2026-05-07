import { NextRequest, NextResponse } from "next/server";

import { AiCardDraftCreateSchema } from "@/contracts/ai-card-drafts";
import { createAiRequestDiagnostics } from "@/server/ai/diagnostics";
import { aiCardDraftService } from "@/server/ai-card-drafts/service";
import { getCurrentSession } from "@/server/auth/current-session";
import {
  authRequired,
  invalidRequest,
  readJson,
  serviceErrorResponse
} from "../route-helpers";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const diagnostics = createAiRequestDiagnostics({
    route: "/api/ai-card-drafts/onboarding-preview"
  });
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  const parsed = AiCardDraftCreateSchema.safeParse(await readJson(request));
  if (!parsed.success || !parsed.data.inputText) {
    return invalidRequest();
  }

  try {
    return NextResponse.json(
      await aiCardDraftService.createOnboardingPreview(
        session,
        {
          inputText: parsed.data.inputText
        },
        diagnostics
      )
    );
  } catch (error) {
    return serviceErrorResponse(error, diagnostics);
  }
}
