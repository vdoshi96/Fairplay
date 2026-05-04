import { createHmac, randomBytes } from "crypto";

import type { HouseholdId } from "../../domain/ids";
import {
  createSession,
  type SessionSummary
} from "../repositories/sessions";

export const SESSION_IDLE_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;
export const SESSION_ABSOLUTE_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000;

export type SessionRepository = {
  createSession: typeof createSession;
};

export type CreateHouseholdSessionInput = {
  householdId: HouseholdId;
  now?: Date;
  repository?: SessionRepository;
  userAgent?: string | null;
};

export type CreatedSession = {
  rawToken: string;
  session: SessionSummary;
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production.");
  }

  return "fairplay-development-session-secret";
}

export function createRawSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSecretValue(value: string, purpose: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(purpose)
    .update(":")
    .update(value)
    .digest("hex");
}

export function hashSessionToken(rawToken: string): string {
  return hashSecretValue(rawToken, "session-token");
}

export function hashRequestUserAgent(userAgent: string | null | undefined): string | null {
  if (!userAgent) {
    return null;
  }

  return hashSecretValue(userAgent, "user-agent");
}

export function getSessionExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + SESSION_ABSOLUTE_EXPIRATION_MS);
}

export async function createSessionForHousehold(
  input: CreateHouseholdSessionInput
): Promise<CreatedSession> {
  const now = input.now ?? new Date();
  const rawToken = createRawSessionToken();
  const session = await (input.repository ?? { createSession }).createSession({
    householdId: input.householdId,
    tokenHash: hashSessionToken(rawToken),
    expiresAt: getSessionExpiresAt(now),
    selectedPersonaId: null,
    userAgentHash: hashRequestUserAgent(input.userAgent)
  });

  return {
    rawToken,
    session
  };
}
