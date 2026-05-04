import type { AuthThrottle } from "@prisma/client";

import { prisma } from "../db/prisma";

export type AuthThrottleSummary = {
  usernameNormalized: string;
  ipHash: string;
  failedAttemptCount: number;
  windowStartedAt: string;
  throttledUntil: string | null;
  lastAttemptAt: string;
};

function toAuthThrottleSummary(throttle: AuthThrottle): AuthThrottleSummary {
  return {
    usernameNormalized: throttle.usernameNormalized,
    ipHash: throttle.ipHash,
    failedAttemptCount: throttle.failedAttemptCount,
    windowStartedAt: throttle.windowStartedAt.toISOString(),
    throttledUntil: throttle.throttledUntil?.toISOString() ?? null,
    lastAttemptAt: throttle.lastAttemptAt.toISOString()
  };
}

export async function recordFailedLoginAttempt(input: {
  usernameNormalized: string;
  ipHash: string;
  attemptedAt?: string | Date;
  throttleAfterAttempts?: number;
  throttleForMs?: number;
}): Promise<AuthThrottleSummary> {
  const attemptedAt = input.attemptedAt ? new Date(input.attemptedAt) : new Date();
  const throttleAfterAttempts = input.throttleAfterAttempts ?? 5;
  const throttleForMs = input.throttleForMs ?? 15 * 60 * 1000;
  const existing = await prisma.authThrottle.findUnique({
    where: {
      usernameNormalized_ipHash: {
        usernameNormalized: input.usernameNormalized,
        ipHash: input.ipHash
      }
    }
  });
  const nextFailedAttemptCount = (existing?.failedAttemptCount ?? 0) + 1;
  const throttledUntil =
    nextFailedAttemptCount >= throttleAfterAttempts
      ? new Date(attemptedAt.getTime() + throttleForMs)
      : existing?.throttledUntil ?? null;
  const throttle = await prisma.authThrottle.upsert({
    where: {
      usernameNormalized_ipHash: {
        usernameNormalized: input.usernameNormalized,
        ipHash: input.ipHash
      }
    },
    create: {
      usernameNormalized: input.usernameNormalized,
      ipHash: input.ipHash,
      failedAttemptCount: 1,
      windowStartedAt: attemptedAt,
      throttledUntil,
      lastAttemptAt: attemptedAt
    },
    update: {
      failedAttemptCount: nextFailedAttemptCount,
      throttledUntil,
      lastAttemptAt: attemptedAt
    }
  });

  return toAuthThrottleSummary(throttle);
}

export async function getAuthThrottle(input: {
  usernameNormalized: string;
  ipHash: string;
}): Promise<AuthThrottleSummary | null> {
  const throttle = await prisma.authThrottle.findUnique({
    where: {
      usernameNormalized_ipHash: input
    }
  });

  return throttle ? toAuthThrottleSummary(throttle) : null;
}

export async function resetAuthThrottle(input: {
  usernameNormalized: string;
  ipHash: string;
}): Promise<void> {
  await prisma.authThrottle.deleteMany({
    where: input
  });
}
