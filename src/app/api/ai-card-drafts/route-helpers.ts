import { NextResponse } from "next/server";
import { z } from "zod";

import type { AiDiagnosticsContext } from "@/server/ai/diagnostics";

const AiCardDraftIdSchema = z.string().uuid();

export type AiCardDraftRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function parseAiCardDraftId(context: AiCardDraftRouteContext) {
  const params = await context.params;
  const parsed = AiCardDraftIdSchema.safeParse(params.id);

  return parsed.success ? parsed.data : null;
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function authRequired() {
  return NextResponse.json(
    { error: "Authentication required." },
    { status: 401 }
  );
}

export function invalidRequest() {
  return NextResponse.json({ error: "Invalid request." }, { status: 400 });
}

export function serviceErrorResponse(
  error: unknown,
  diagnostics?: AiDiagnosticsContext
): NextResponse {
  const code =
    error && typeof error === "object" && "code" in error ? error.code : null;

  if (code === "INVALID_INPUT") {
    return invalidRequest();
  }

  if (code === "AUTH_REQUIRED") {
    return authRequired();
  }

  if (code === "NOT_FOUND") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (code === "GENERATION_FAILED") {
    const draftId =
      error && typeof error === "object" && "draftId" in error &&
      typeof error.draftId === "string"
        ? error.draftId
        : undefined;

    return NextResponse.json(
      {
        error: "AI card draft generation failed.",
        code: "GENERATION_FAILED",
        ...(diagnostics ? { requestId: diagnostics.requestId } : {}),
        ...(draftId ? { draftId } : {})
      },
      { status: 502 }
    );
  }

  throw error;
}
