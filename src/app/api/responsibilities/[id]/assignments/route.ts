import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  ResponsibilityAssignmentSummarySchema
} from "@/contracts/responsibilities";
import { IsoDateTimeSchema } from "@/domain/time";
import { ResponsibilityIdSchema } from "@/domain/ids";
import { getCurrentSession } from "@/server/auth/current-session";
import { responsibilityService } from "@/server/responsibilities/service";

export const runtime = "nodejs";

const AssignmentMutationSchema = z
  .object({
    effectiveAt: IsoDateTimeSchema,
    assignments: z.array(ResponsibilityAssignmentSummarySchema),
    handoffNotes: z.string().trim().max(2000).optional(),
    revisitAt: IsoDateTimeSchema.optional()
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
  const parsed = AssignmentMutationSchema.safeParse(await readJson(request));

  if (!responsibilityId || !parsed.success) {
    return invalidRequest();
  }

  try {
    return NextResponse.json(
      await responsibilityService.updateAssignments(
        session,
        responsibilityId,
        parsed.data
      )
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

  if (code === "AUTH_REQUIRED") {
    return authRequired();
  }

  if (code === "CONFLICT") {
    return NextResponse.json(
      { error: "Ownership agreement changed. Refresh and try again." },
      { status: 409 }
    );
  }

  if (code === "NOT_FOUND") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  throw error;
}
