import { NextResponse } from "next/server";

import { RadarItemIdSchema } from "@/domain/ids";

export type RadarRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function parseRadarId(context: RadarRouteContext) {
  const params = await context.params;
  const parsed = RadarItemIdSchema.safeParse(params.id);

  return parsed.success ? parsed.data : null;
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
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

export function serviceErrorResponse(error: unknown): NextResponse {
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

  throw error;
}
