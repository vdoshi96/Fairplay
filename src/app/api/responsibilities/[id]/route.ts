import { NextRequest, NextResponse } from "next/server";

import { ResponsibilityIdSchema } from "@/domain/ids";
import { ResponsibilityUpdateSchema } from "@/contracts/responsibilities";
import { getCurrentSession } from "@/server/auth/current-session";
import { responsibilityService } from "@/server/responsibilities/service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  const responsibilityId = await parseId(context);
  if (!responsibilityId) {
    return invalidRequest();
  }

  try {
    return NextResponse.json(
      await responsibilityService.get(session, responsibilityId)
    );
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  const responsibilityId = await parseId(context);
  if (!responsibilityId) {
    return invalidRequest();
  }

  const body = await readJson(request);
  const parsed = ResponsibilityUpdateSchema.safeParse({
    ...(isRecord(body) ? body : {}),
    id: responsibilityId
  });
  if (!parsed.success) {
    return invalidRequest();
  }

  const { id, ...update } = parsed.data;
  if (id !== responsibilityId) {
    return invalidRequest();
  }

  try {
    return NextResponse.json(
      await responsibilityService.update(session, responsibilityId, update)
    );
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

async function parseId(context: RouteContext) {
  const params = await context.params;
  const parsed = ResponsibilityIdSchema.safeParse(params.id);

  return parsed.success ? parsed.data : null;
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

function serviceErrorResponse(error: unknown): NextResponse {
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
