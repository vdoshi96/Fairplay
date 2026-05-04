import type { AuthThrottle, Prisma } from "@prisma/client";

import { isUniqueConstraintError } from "../db/errors";
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
  const throttleKey = {
    usernameNormalized: input.usernameNormalized,
    ipHash: input.ipHash
  };

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const throttle = await incrementFailedAttemptCount({
          tx,
          throttleKey,
          attemptedAt
        });

        if (throttle.failedAttemptCount < throttleAfterAttempts) {
          return toAuthThrottleSummary(throttle);
        }

        const throttledUntil = new Date(attemptedAt.getTime() + throttleForMs);
        const throttled = await tx.authThrottle.update({
          where: {
            id: throttle.id
          },
          data: {
            throttledUntil
          }
        });

        return toAuthThrottleSummary(throttled);
      });
    } catch (error) {
      if (attempt === 1 && isUniqueConstraintError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Unable to record failed login attempt.");
}

async function incrementFailedAttemptCount(input: {
  tx: Prisma.TransactionClient;
  throttleKey: {
    usernameNormalized: string;
    ipHash: string;
  };
  attemptedAt: Date;
}) {
  return input.tx.authThrottle.upsert({
    where: {
      usernameNormalized_ipHash: input.throttleKey
    },
    create: {
      ...input.throttleKey,
      failedAttemptCount: 1,
      windowStartedAt: input.attemptedAt,
      throttledUntil: null,
      lastAttemptAt: input.attemptedAt
    },
    update: {
      failedAttemptCount: {
        increment: 1
      },
      lastAttemptAt: input.attemptedAt
    }
  });
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
