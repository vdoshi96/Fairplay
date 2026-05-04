import type { NextRequest } from "next/server";

import { getSessionCookieValue } from "./cookies";
import {
  SESSION_ABSOLUTE_EXPIRATION_MS,
  SESSION_IDLE_EXPIRATION_MS,
  hashSessionToken
} from "./sessions";
import {
  findSessionByTokenHash,
  type SessionSummary
} from "../repositories/sessions";

export type CurrentSession = SessionSummary;

export function isSessionActive(session: SessionSummary, now = new Date()): boolean {
  if (session.revokedAt) {
    return false;
  }

  const createdAt = new Date(session.createdAt);
  const lastSeenAt = new Date(session.lastSeenAt);
  const expiresAt = new Date(session.expiresAt);

  if (expiresAt <= now) {
    return false;
  }

  if (createdAt.getTime() + SESSION_ABSOLUTE_EXPIRATION_MS <= now.getTime()) {
    return false;
  }

  return lastSeenAt.getTime() + SESSION_IDLE_EXPIRATION_MS > now.getTime();
}

export async function getCurrentSession(
  request: NextRequest,
  now = new Date()
): Promise<CurrentSession | null> {
  const rawToken = getSessionCookieValue(request);
  if (!rawToken) {
    return null;
  }

  const session = await findSessionByTokenHash(hashSessionToken(rawToken));
  if (!session || !isSessionActive(session, now)) {
    return null;
  }

  return session;
}
