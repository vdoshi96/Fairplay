import { NextRequest, NextResponse } from "next/server";

import { LoginRequestSchema } from "@/contracts/auth";
import { setSessionCookie } from "@/server/auth/cookies";
import {
  MISSING_CREDENTIAL_PASSWORD_HASH,
  verifyPassword
} from "@/server/auth/passwords";
import { createSessionForHousehold } from "@/server/auth/sessions";
import {
  getClientIp,
  getLoginThrottleState,
  hashClientIp,
  recordLoginFailure,
  resetLoginThrottle
} from "@/server/auth/throttle";
import { findHouseholdByUsernameNormalized } from "@/server/repositories/households";
import { toPersonaSummary } from "@/server/repositories/personas";

export const runtime = "nodejs";

const GENERIC_LOGIN_ERROR = "Unable to log in with that username and password.";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsed = LoginRequestSchema.safeParse(await readJson(request));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const usernameNormalized = parsed.data.username;
  const ipHash = hashClientIp(getClientIp(request));
  const throttle = await getLoginThrottleState({
    usernameNormalized,
    ipHash
  });

  if (throttle.throttled) {
    return NextResponse.json(
      { error: GENERIC_LOGIN_ERROR },
      {
        status: 429,
        headers: {
          "retry-after": String(throttle.retryAfterSeconds ?? 900)
        }
      }
    );
  }

  const household = await findHouseholdByUsernameNormalized(usernameNormalized);
  const passwordHash =
    household?.credential?.passwordHash ?? MISSING_CREDENTIAL_PASSWORD_HASH;
  const validPassword = await verifyPassword(passwordHash, parsed.data.password);

  if (!household?.credential || !validPassword) {
    await recordLoginFailure({
      usernameNormalized,
      ipHash
    });

    return NextResponse.json({ error: GENERIC_LOGIN_ERROR }, { status: 401 });
  }

  await resetLoginThrottle({
    usernameNormalized,
    ipHash
  });

  const createdSession = await createSessionForHousehold({
    householdId: household.id,
    userAgent: request.headers.get("user-agent")
  });
  const response = NextResponse.json({
    household: {
      id: household.id,
      name: household.name
    },
    personas: household.personas
      .sort((left, right) => (left.key === "alex" && right.key === "max" ? -1 : 1))
      .map(toPersonaSummary),
    requiresPersonaSelection: true
  });

  setSessionCookie(response, createdSession.rawToken, createdSession.session.expiresAt);

  return response;
}

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
