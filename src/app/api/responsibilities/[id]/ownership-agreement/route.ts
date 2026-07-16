import { NextRequest, NextResponse } from "next/server";

import { OwnershipAgreementMutationSchema } from "@/contracts/ownership-agreement";
import { ResponsibilityIdSchema } from "@/domain/ids";
import { getCurrentSession } from "@/server/auth/current-session";
import { responsibilityService } from "@/server/responsibilities/service";

export const runtime = "nodejs";

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
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 }
    );
  }

  const params = await context.params;
  const responsibilityId = ResponsibilityIdSchema.safeParse(params.id);
  const input = OwnershipAgreementMutationSchema.safeParse(await readJson(request));

  if (!responsibilityId.success || !input.success) {
    return invalidRequest();
  }

  try {
    return NextResponse.json(
      await responsibilityService.updateOwnershipAgreement(
        session,
        responsibilityId.data,
        input.data
      )
    );
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error ? error.code : null;

    if (code === "INVALID_INPUT") {
      return invalidRequest();
    }

    if (code === "AUTH_REQUIRED") {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
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
}

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function invalidRequest() {
  return NextResponse.json({ error: "Invalid request." }, { status: 400 });
}
