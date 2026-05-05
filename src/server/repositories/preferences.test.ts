import { randomUUID } from "node:crypto";

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../db/prisma";
import { createHouseholdWithPersonas } from "./households";
import {
  getOnboardingPreferences,
  replayWelcome,
  updateOnboardingPreferences
} from "./preferences";

const createdHouseholdIds = new Set<string>();

function uniqueUsername(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

async function createTestPersona() {
  const { household, personas } = await createHouseholdWithPersonas({
    householdName: "Preference Home",
    usernameNormalized: uniqueUsername("preferences"),
    timezone: "America/Chicago",
    passwordHash: `argon2id-test-hash-${randomUUID()}`,
    hashAlgorithm: "argon2id",
    hashParamsVersion: "test"
  });
  createdHouseholdIds.add(household.id);

  return personas[0];
}

beforeAll(() => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for repository integration tests.");
  }
});

afterEach(async () => {
  if (createdHouseholdIds.size === 0) {
    return;
  }

  await prisma.household.deleteMany({
    where: { id: { in: [...createdHouseholdIds] } }
  });
  createdHouseholdIds.clear();
});

describe("onboarding preference repository", () => {
  it("creates default persona-scoped onboarding preferences", async () => {
    const persona = await createTestPersona();

    const preferences = await getOnboardingPreferences(persona.id);

    expect(preferences).toMatchObject({
      personaId: persona.id,
      welcomeDismissedAt: null,
      crashCourseSkippedAt: null,
      crashCourseCompletedAt: null,
      crashCourseCurrentStep: 0,
      crashCourseReplayRequestedAt: null
    });
    expect(new Date(preferences.updatedAt).toString()).not.toBe("Invalid Date");
  });

  it("returns one preference record when default initialization races", async () => {
    const persona = await createTestPersona();

    const initialized = await Promise.all(
      Array.from({ length: 8 }, () => getOnboardingPreferences(persona.id))
    );

    expect(initialized).toHaveLength(8);
    expect(initialized.every((preference) => preference.personaId === persona.id))
      .toBe(true);
    await expect(
      prisma.personaOnboardingPreferences.count({
        where: { personaId: persona.id }
      })
    ).resolves.toBe(1);
  });

  it("updates crash-course progress and clears welcome dismissal for replay", async () => {
    const persona = await createTestPersona();
    const dismissedAt = "2026-05-04T12:00:00.000Z";
    const replayRequestedAt = "2026-05-04T13:00:00.000Z";

    await updateOnboardingPreferences(persona.id, {
      welcomeDismissedAt: dismissedAt,
      crashCourseCurrentStep: 4,
      crashCourseSkippedAt: "2026-05-04T12:30:00.000Z"
    });

    const replayed = await replayWelcome(persona.id, replayRequestedAt);

    expect(replayed).toMatchObject({
      personaId: persona.id,
      welcomeDismissedAt: null,
      crashCourseCurrentStep: 4,
      crashCourseSkippedAt: "2026-05-04T12:30:00.000Z",
      crashCourseReplayRequestedAt: replayRequestedAt
    });
  });
});
