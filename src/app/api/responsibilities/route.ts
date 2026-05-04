import { NextRequest, NextResponse } from "next/server";

import { ResponsibilityCreateSchema } from "@/contracts/responsibilities";
import { getCurrentSession } from "@/server/auth/current-session";
import { responsibilityService } from "@/server/responsibilities/service";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  return NextResponse.json(await responsibilityService.listOverview(session));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  const parsed = ResponsibilityCreateSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return invalidRequest();
  }

  try {
    const created = await responsibilityService.create(session, parsed.data);

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
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
