import { NextRequest, NextResponse } from "next/server";

import { CardTemplateSearchParamsSchema } from "@/contracts/card-templates";
import { getCurrentSession } from "@/server/auth/current-session";
import { listCardTemplates } from "@/server/repositories/card-templates";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  const parsed = CardTemplateSearchParamsSchema.safeParse(
    searchParams(request.nextUrl.searchParams)
  );
  if (!parsed.success) {
    return invalidRequest();
  }

  return NextResponse.json(await listCardTemplates(parsed.data));
}

function searchParams(params: URLSearchParams) {
  const q = params.get("q") ?? undefined;
  const labelParams = [
    ...params.getAll("label"),
    ...params.getAll("labels").flatMap((labels) => labels.split(","))
  ]
    .map((label) => label.trim())
    .filter(Boolean);
  const lane = params.get("lane") ?? undefined;

  return {
    q,
    labels: labelParams.length > 0 ? labelParams : undefined,
    lane
  };
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
