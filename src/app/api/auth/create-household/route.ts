import { NextRequest, NextResponse } from "next/server";

import { CreateHouseholdRequestSchema } from "@/contracts/auth";
import { setSessionCookie } from "@/server/auth/cookies";
import { consumeHouseholdCreationAttempt } from "@/server/auth/household-creation-rate-limit";
import { hashPassword } from "@/server/auth/passwords";
import { readBoundedJsonBody } from "@/server/auth/request-body-limit";
import { createSessionForHousehold } from "@/server/auth/sessions";
import { RepositoryError } from "@/server/db/errors";
import { createHouseholdWithPersonas } from "@/server/repositories/households";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rateLimit = consumeHouseholdCreationAttempt(request.headers);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Unable to create a household right now." },
      {
        status: 429,
        headers: {
          "retry-after": String(rateLimit.retryAfterSeconds)
        }
      }
    );
  }

  const body = await readBoundedJsonBody(request);
  if (!body.ok) {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: body.reason === "too_large" ? 413 : 400 }
    );
  }

  const parsed = CreateHouseholdRequestSchema.safeParse(body.value);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const password = await hashPassword(parsed.data.password);
    const household = await createHouseholdWithPersonas({
      householdName: parsed.data.householdName,
      usernameNormalized: parsed.data.username,
      timezone: parsed.data.timezone,
      passwordHash: password.passwordHash,
      hashAlgorithm: password.hashAlgorithm,
      hashParamsVersion: password.hashParamsVersion
    });
    const createdSession = await createSessionForHousehold({
      householdId: household.household.id,
      userAgent: request.headers.get("user-agent")
    });
    const response = NextResponse.json(household, { status: 201 });
    setSessionCookie(
      response,
      createdSession.rawToken,
      createdSession.session.expiresAt
    );

    return response;
  } catch (error) {
    if (error instanceof RepositoryError && error.code === "CONFLICT") {
      return NextResponse.json(
        { error: "Username unavailable." },
        { status: 409 }
      );
    }

    throw error;
  }
}
