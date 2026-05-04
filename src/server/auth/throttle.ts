import type { NextRequest } from "next/server";

import {
  getAuthThrottle,
  recordFailedLoginAttempt,
  resetAuthThrottle
} from "../repositories/auth-throttle";
import { hashSecretValue } from "./sessions";

export const FAILED_LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const FAILED_LOGIN_THROTTLE_MS = 15 * 60 * 1000;
export const FAILED_LOGIN_ATTEMPT_LIMIT = 5;

export type LoginThrottleState = {
  throttled: boolean;
  retryAfterSeconds?: number;
};

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export function hashClientIp(ip: string): string {
  return hashSecretValue(ip, "login-ip");
}

export async function getLoginThrottleState(input: {
  usernameNormalized: string;
  ipHash: string;
  now?: Date;
}): Promise<LoginThrottleState> {
  const now = input.now ?? new Date();
  const throttle = await getAuthThrottle({
    usernameNormalized: input.usernameNormalized,
    ipHash: input.ipHash
  });

  if (!throttle?.throttledUntil) {
    return { throttled: false };
  }

  const throttledUntil = new Date(throttle.throttledUntil);
  if (throttledUntil <= now) {
    return { throttled: false };
  }

  return {
    throttled: true,
    retryAfterSeconds: Math.ceil((throttledUntil.getTime() - now.getTime()) / 1000)
  };
}

export async function recordLoginFailure(input: {
  usernameNormalized: string;
  ipHash: string;
  now?: Date;
}): Promise<void> {
  const now = input.now ?? new Date();
  const existing = await getAuthThrottle({
    usernameNormalized: input.usernameNormalized,
    ipHash: input.ipHash
  });

  if (
    existing &&
    new Date(existing.windowStartedAt).getTime() + FAILED_LOGIN_WINDOW_MS <=
      now.getTime()
  ) {
    await resetAuthThrottle({
      usernameNormalized: input.usernameNormalized,
      ipHash: input.ipHash
    });
  }

  await recordFailedLoginAttempt({
    usernameNormalized: input.usernameNormalized,
    ipHash: input.ipHash,
    attemptedAt: now,
    throttleAfterAttempts: FAILED_LOGIN_ATTEMPT_LIMIT,
    throttleForMs: FAILED_LOGIN_THROTTLE_MS
  });
}

export async function resetLoginThrottle(input: {
  usernameNormalized: string;
  ipHash: string;
}): Promise<void> {
  await resetAuthThrottle(input);
}
