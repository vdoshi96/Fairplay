import { NextRequest, NextResponse } from "next/server";

import { CreateHouseholdRequestSchema } from "@/contracts/auth";
import { RepositoryError } from "@/server/db/errors";
import { setSessionCookie } from "@/server/auth/cookies";
import { hashPassword } from "@/server/auth/passwords";
import { createSessionForHousehold } from "@/server/auth/sessions";
import { createHouseholdWithPersonas } from "@/server/repositories/households";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsed = CreateHouseholdRequestSchema.safeParse(await readJson(request));

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

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
