import { NextResponse } from "next/server";

export type CheckInRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export type CheckInItemRouteContext = {
  params: Promise<{
    id: string;
    itemId: string;
  }>;
};

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
