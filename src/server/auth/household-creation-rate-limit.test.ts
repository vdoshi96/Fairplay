import { describe, expect, it } from "vitest";

import {
  HOUSEHOLD_CREATION_RATE_LIMIT_ATTEMPTS,
  HOUSEHOLD_CREATION_RATE_LIMIT_WINDOW_MS,
  HouseholdCreationRateLimiter,
  getHouseholdCreationClientKey
} from "./household-creation-rate-limit";

describe("household creation client keys", () => {
  it("stores a stable privacy hash instead of the raw client address", () => {
    const address = "203.0.113.10";
    const key = getHouseholdCreationClientKey(
      new Headers({ "x-forwarded-for": address })
    );

    expect(key).not.toContain(address);
    expect(key).toBe(
      getHouseholdCreationClientKey(
        new Headers({ "x-forwarded-for": address })
      )
    );
  });

  it("uses the rightmost valid forwarded address so prepended spoof values do not change the key", () => {
    const trustedHop = "203.0.113.10";

    expect(
      getHouseholdCreationClientKey(
        new Headers({
          "x-forwarded-for": `198.51.100.8, ${trustedHop}`
        })
      )
    ).toBe(
      getHouseholdCreationClientKey(
        new Headers({
          "x-forwarded-for": `192.0.2.44, ${trustedHop}`
        })
      )
    );
  });

  it("coalesces absent, invalid, and unreasonably long forwarded headers conservatively", () => {
    const unknownKey = getHouseholdCreationClientKey(new Headers());

    expect(
      getHouseholdCreationClientKey(
        new Headers({ "x-forwarded-for": "not-an-ip" })
      )
    ).toBe(unknownKey);
    expect(
      getHouseholdCreationClientKey(
        new Headers({ "x-forwarded-for": "x".repeat(513) })
      )
    ).toBe(unknownKey);
  });
});

describe("HouseholdCreationRateLimiter", () => {
  it("allows the configured fixed-window ceiling and returns deterministic retry timing", () => {
    let nowMs = 0;
    const limiter = new HouseholdCreationRateLimiter({
      clock: () => nowMs,
      globalAttemptLimit: 20,
      attemptLimit: 2,
      windowMs: 10_000
    });

    expect(limiter.consume("client-a")).toEqual({ allowed: true });
    nowMs = 1_500;
    expect(limiter.consume("client-a")).toEqual({ allowed: true });
    expect(limiter.consume("client-a")).toEqual({
      allowed: false,
      retryAfterSeconds: 9
    });
  });

  it("resets at the exact window boundary and prunes expired client buckets", () => {
    let nowMs = 0;
    const limiter = new HouseholdCreationRateLimiter({
      clock: () => nowMs,
      globalAttemptLimit: 20,
      attemptLimit: 1,
      windowMs: 1_000
    });

    expect(limiter.consume("expired-client")).toEqual({ allowed: true });
    expect(limiter.trackedClientCount).toBe(1);
    expect(limiter.consume("expired-client")).toEqual({
      allowed: false,
      retryAfterSeconds: 1
    });

    nowMs = 1_000;
    expect(limiter.consume("new-client")).toEqual({ allowed: true });
    expect(limiter.trackedClientCount).toBe(1);
    expect(limiter.consume("expired-client")).toEqual({ allowed: true });

    limiter.reset();
    expect(limiter.trackedClientCount).toBe(0);
    expect(limiter.consume("expired-client")).toEqual({ allowed: true });
  });

  it("applies a process-wide ceiling when clients rotate spoofable header values", () => {
    const limiter = new HouseholdCreationRateLimiter({
      attemptLimit: 10,
      globalAttemptLimit: 2,
      windowMs: 10_000
    });

    expect(limiter.consume("rotated-a")).toEqual({ allowed: true });
    expect(limiter.consume("rotated-b")).toEqual({ allowed: true });
    expect(limiter.consume("rotated-c")).toEqual({
      allowed: false,
      retryAfterSeconds: 10
    });
  });

  it("uses one bounded overflow bucket instead of growing without limit", () => {
    const limiter = new HouseholdCreationRateLimiter({
      attemptLimit: 2,
      globalAttemptLimit: 20,
      maxTrackedClients: 1,
      windowMs: 10_000
    });

    expect(limiter.consume("tracked")).toEqual({ allowed: true });
    expect(limiter.consume("overflow-a")).toEqual({ allowed: true });
    expect(limiter.consume("overflow-b")).toEqual({ allowed: true });
    expect(limiter.consume("overflow-c")).toEqual({
      allowed: false,
      retryAfterSeconds: 10
    });
    expect(limiter.trackedClientCount).toBe(1);
  });

  it("keeps the production ceiling compatible with sequential local browser QA", () => {
    const limiter = new HouseholdCreationRateLimiter({
      clock: () => 0
    });

    for (
      let attempt = 0;
      attempt < HOUSEHOLD_CREATION_RATE_LIMIT_ATTEMPTS;
      attempt += 1
    ) {
      expect(limiter.consume("local-qa-client")).toEqual({ allowed: true });
    }

    expect(limiter.consume("local-qa-client")).toEqual({
      allowed: false,
      retryAfterSeconds: HOUSEHOLD_CREATION_RATE_LIMIT_WINDOW_MS / 1000
    });
  });
});
