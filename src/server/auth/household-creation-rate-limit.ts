import { createHmac, randomBytes } from "node:crypto";
import { isIP } from "node:net";

export const HOUSEHOLD_CREATION_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const HOUSEHOLD_CREATION_RATE_LIMIT_ATTEMPTS = 32;
export const HOUSEHOLD_CREATION_GLOBAL_RATE_LIMIT_ATTEMPTS = 64;
export const HOUSEHOLD_CREATION_MAX_TRACKED_CLIENTS = 2_048;

const MAX_FORWARDED_HEADER_LENGTH = 512;
const MAX_FORWARDED_HOPS = 16;
const UNKNOWN_CLIENT = "unknown-client";
const CLIENT_KEY_SALT = randomBytes(32);

type FixedWindowBucket = {
  attempts: number;
  startedAtMs: number;
};

export type HouseholdCreationRateLimitResult =
  | { allowed: true }
  | {
      allowed: false;
      retryAfterSeconds: number;
    };

export type HouseholdCreationRateLimiterOptions = {
  attemptLimit?: number;
  clock?: () => number;
  globalAttemptLimit?: number;
  maxTrackedClients?: number;
  windowMs?: number;
};

export class HouseholdCreationRateLimiter {
  private readonly attemptLimit: number;
  private readonly clock: () => number;
  private readonly globalAttemptLimit: number;
  private readonly maxTrackedClients: number;
  private readonly windowMs: number;
  private clientBuckets = new Map<string, FixedWindowBucket>();
  private globalBucket: FixedWindowBucket | null = null;
  private overflowBucket: FixedWindowBucket | null = null;

  constructor(options: HouseholdCreationRateLimiterOptions = {}) {
    this.attemptLimit = positiveInteger(
      options.attemptLimit,
      HOUSEHOLD_CREATION_RATE_LIMIT_ATTEMPTS
    );
    this.clock = options.clock ?? Date.now;
    this.globalAttemptLimit = positiveInteger(
      options.globalAttemptLimit,
      HOUSEHOLD_CREATION_GLOBAL_RATE_LIMIT_ATTEMPTS
    );
    this.maxTrackedClients = positiveInteger(
      options.maxTrackedClients,
      HOUSEHOLD_CREATION_MAX_TRACKED_CLIENTS
    );
    this.windowMs = positiveInteger(
      options.windowMs,
      HOUSEHOLD_CREATION_RATE_LIMIT_WINDOW_MS
    );
  }

  get trackedClientCount(): number {
    return this.clientBuckets.size;
  }

  consume(clientKey: string): HouseholdCreationRateLimitResult {
    const nowMs = this.clock();
    this.pruneExpired(nowMs);
    const existingBucket = this.clientBuckets.get(clientKey);
    const usesOverflowBucket =
      !existingBucket && this.clientBuckets.size >= this.maxTrackedClients;
    const clientResult = consumeBucket(
      usesOverflowBucket ? this.overflowBucket : existingBucket ?? null,
      this.attemptLimit,
      this.windowMs,
      nowMs
    );

    if (!clientResult.allowed) {
      return {
        allowed: false,
        retryAfterSeconds: clientResult.retryAfterSeconds
      };
    }

    const globalResult = consumeBucket(
      this.globalBucket,
      this.globalAttemptLimit,
      this.windowMs,
      nowMs
    );

    if (!globalResult.allowed) {
      return {
        allowed: false,
        retryAfterSeconds: globalResult.retryAfterSeconds
      };
    }

    // Commit the two counters together. Requests rejected by either gate do
    // not consume capacity from the other gate or penalize unrelated clients.
    this.globalBucket = globalResult.bucket;
    if (usesOverflowBucket) {
      this.overflowBucket = clientResult.bucket;
    } else {
      this.clientBuckets.set(clientKey, clientResult.bucket);
    }

    return { allowed: true };
  }

  reset(): void {
    this.clientBuckets.clear();
    this.globalBucket = null;
    this.overflowBucket = null;
  }

  private pruneExpired(nowMs: number): void {
    for (const [clientKey, bucket] of this.clientBuckets) {
      if (isExpired(bucket, this.windowMs, nowMs)) {
        this.clientBuckets.delete(clientKey);
      }
    }

    if (
      this.overflowBucket &&
      isExpired(this.overflowBucket, this.windowMs, nowMs)
    ) {
      this.overflowBucket = null;
    }

    if (this.globalBucket && isExpired(this.globalBucket, this.windowMs, nowMs)) {
      this.globalBucket = null;
    }
  }
}

const householdCreationRateLimiter = new HouseholdCreationRateLimiter();

export function consumeHouseholdCreationAttempt(
  headers: Headers
): HouseholdCreationRateLimitResult {
  return householdCreationRateLimiter.consume(
    getHouseholdCreationClientKey(headers)
  );
}

export function getHouseholdCreationClientKey(headers: Headers): string {
  const clientAddress = getForwardedClientAddress(headers) ?? UNKNOWN_CLIENT;

  return createHmac("sha256", CLIENT_KEY_SALT)
    .update("household-creation-client:")
    .update(clientAddress)
    .digest("base64url");
}

function getForwardedClientAddress(headers: Headers): string | null {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor && forwardedFor.length <= MAX_FORWARDED_HEADER_LENGTH) {
    const hops = forwardedFor.split(",").slice(-MAX_FORWARDED_HOPS);

    for (let index = hops.length - 1; index >= 0; index -= 1) {
      const normalized = normalizeIpAddress(hops[index]);
      if (normalized) {
        return normalized;
      }
    }
  }

  return normalizeIpAddress(headers.get("x-real-ip"));
}

function normalizeIpAddress(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  let candidate = value.trim();
  const bracketedIpv6 = /^\[([^\]]+)\](?::\d+)?$/.exec(candidate);
  if (bracketedIpv6) {
    candidate = bracketedIpv6[1];
  } else if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(candidate)) {
    candidate = candidate.slice(0, candidate.lastIndexOf(":"));
  }

  return isIP(candidate) > 0 ? candidate.toLowerCase() : null;
}

function consumeBucket(
  bucket: FixedWindowBucket | null,
  attemptLimit: number,
  windowMs: number,
  nowMs: number
):
  | { allowed: true; bucket: FixedWindowBucket }
  | {
      allowed: false;
      bucket: FixedWindowBucket;
      retryAfterSeconds: number;
    } {
  if (!bucket || isExpired(bucket, windowMs, nowMs)) {
    return {
      allowed: true,
      bucket: {
        attempts: 1,
        startedAtMs: nowMs
      }
    };
  }

  if (bucket.attempts >= attemptLimit) {
    return {
      allowed: false,
      bucket,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((bucket.startedAtMs + windowMs - nowMs) / 1000)
      )
    };
  }

  return {
    allowed: true,
    bucket: {
      ...bucket,
      attempts: bucket.attempts + 1
    }
  };
}

function isExpired(
  bucket: FixedWindowBucket,
  windowMs: number,
  nowMs: number
): boolean {
  return bucket.startedAtMs + windowMs <= nowMs;
}

function positiveInteger(value: number | undefined, fallback: number): number {
  return Number.isSafeInteger(value) && (value ?? 0) > 0 ? value! : fallback;
}
