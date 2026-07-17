import type { NextRequest } from "next/server";
import { cache } from "react";

import { getSessionCookieValue } from "./cookies";
import {
  SESSION_ABSOLUTE_EXPIRATION_MS,
  SESSION_IDLE_EXPIRATION_MS,
  hashSessionToken
} from "./sessions";
import {
  findSessionByTokenHash,
  touchSessionActivity,
  type SessionSummary
} from "../repositories/sessions";

export type CurrentSession = SessionSummary;

export const SESSION_ACTIVITY_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

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

async function resolveCurrentSession(
  rawToken: string,
  now = new Date()
): Promise<CurrentSession | null> {
  const session = await findSessionByTokenHash(hashSessionToken(rawToken));
  if (!session || !isSessionActive(session, now)) {
    return null;
  }

  if (
    new Date(session.lastSeenAt).getTime() + SESSION_ACTIVITY_REFRESH_INTERVAL_MS >
    now.getTime()
  ) {
    return session;
  }

  const refreshedSession = await touchSessionActivity({
    sessionId: session.id,
    householdId: session.householdId,
    seenAt: now,
    lastSeenAtOrBefore: new Date(
      now.getTime() - SESSION_ACTIVITY_REFRESH_INTERVAL_MS
    )
  });

  return refreshedSession && isSessionActive(refreshedSession, now)
    ? refreshedSession
    : null;
}

const resolveCurrentSessionForRequest = cache(
  (rawToken: string, nowTimestamp?: number) =>
    resolveCurrentSession(
      rawToken,
      nowTimestamp === undefined ? new Date() : new Date(nowTimestamp)
    )
);

export async function getCurrentSession(
  request: NextRequest,
  now?: Date
): Promise<CurrentSession | null> {
  const rawToken = getSessionCookieValue(request);
  if (!rawToken) {
    return null;
  }

  return resolveCurrentSessionForRequest(rawToken, now?.getTime());
}
