import { NextRequest, NextResponse } from "next/server";

import { AiCardDraftCreateSchema } from "@/contracts/ai-card-drafts";
import { createAiRequestDiagnostics } from "@/server/ai/diagnostics";
import { getCurrentSession } from "@/server/auth/current-session";
import { aiCardDraftService } from "@/server/ai-card-drafts/service";
import {
  authRequired,
  invalidRequest,
  readJson,
  serviceErrorResponse
} from "./route-helpers";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  try {
    return NextResponse.json(await aiCardDraftService.list(session));
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const diagnostics = createAiRequestDiagnostics({ route: "/api/ai-card-drafts" });
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.toLowerCase().includes("multipart/form-data")) {
    return invalidRequest();
  }

  const parsed = AiCardDraftCreateSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return invalidRequest();
  }
  const inputText = parsed.data.inputText;
  if (!inputText) {
    return invalidRequest();
  }

  try {
    const created = await aiCardDraftService.createFromText(session, {
      inputText
    }, diagnostics);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return serviceErrorResponse(error, diagnostics);
  }
}
