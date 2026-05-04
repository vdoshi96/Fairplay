import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  RadarReasonKeySchema,
  UrgencySchema,
  VisibilitySchema
} from "@/domain/enums";
import { ResponsibilityIdSchema } from "@/domain/ids";
import { getCurrentSession } from "@/server/auth/current-session";
import { responsibilityService } from "@/server/responsibilities/service";

export const runtime = "nodejs";

const RadarFlagSchema = z
  .object({
    reasonKey: RadarReasonKeySchema.refine(
      (value) => value === "review_due" || value === "unclear_expectation"
    ),
    visibility: VisibilitySchema,
    topic: z.string().trim().min(1).max(160).optional(),
    notes: z.string().trim().max(4000).nullable().optional(),
    urgency: UrgencySchema.optional(),
    confirmPublish: z.boolean().optional()
  })
  .strict();

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const session = await getCurrentSession(request);

  if (!session) {
    return authRequired();
  }

  const responsibilityId = await parseId(context);
  const parsed = RadarFlagSchema.safeParse(await readJson(request));

  if (!responsibilityId || !parsed.success) {
    return invalidRequest();
  }

  try {
    const radarItem = await responsibilityService.flagForRadar(
      session,
      responsibilityId,
      parsed.data
    );

    return NextResponse.json(radarItem, { status: 201 });
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
