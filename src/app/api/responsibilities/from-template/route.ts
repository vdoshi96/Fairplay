import { NextRequest, NextResponse } from "next/server";

import { ResponsibilityFromTemplateMutationSchema } from "@/contracts/responsibilities";
import { getCurrentSession } from "@/server/auth/current-session";
import { createResponsibilityFromTemplate } from "@/server/repositories/card-templates";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session?.selectedPersonaId) {
    return authRequired();
  }

  const body = await readJson(request);
  const parsed = ResponsibilityFromTemplateMutationSchema.safeParse({
    ...(isRecord(body) ? body : {}),
    actorPersonaId: session.selectedPersonaId
  });
  if (!parsed.success) {
    return invalidRequest();
  }

  try {
    const created = await createResponsibilityFromTemplate({
      householdId: session.householdId,
      actorPersonaId: session.selectedPersonaId,
      templateId: parsed.data.templateId,
      lane: parsed.data.lane,
      titleOverride: parsed.data.titleOverride
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return repositoryErrorResponse(error);
  }
}

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function authRequired() {
  return NextResponse.json(
    { error: "Authentication required." },
    { status: 401 }
  );
}

function invalidRequest() {
  return NextResponse.json({ error: "Invalid request." }, { status: 400 });
}

function repositoryErrorResponse(error: unknown): NextResponse {
  const code =
    error && typeof error === "object" && "code" in error ? error.code : null;

  if (code === "INVALID_INPUT") {
    return invalidRequest();
  }

  if (code === "NOT_FOUND") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  throw error;
}
