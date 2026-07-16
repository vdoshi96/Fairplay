import { randomUUID } from "node:crypto";

import type { ResponsibilityBoardLane } from "@prisma/client";
import { afterEach, beforeAll, describe, expect, test } from "vitest";

import { prisma } from "../db/prisma";
import { createHouseholdWithPersonas } from "./households";
import { listPersonasForHousehold } from "./personas";
import {
  addResponsibilityAssignments,
  applyResponsibilityCardDistribution,
  createResponsibility,
  getResponsibilityDetail,
  updateResponsibilityBoardPlacement
} from "./responsibilities";
import {
  completeCheckIn,
  createCheckIn,
  recordCheckInItemDecision
} from "./check-ins";
import { computeAndStoreLoadSnapshot } from "./load-snapshots";
import {
  createSession,
  revokeSession,
  selectSessionPersona
} from "./sessions";
import {
  getAuthThrottle,
  recordFailedLoginAttempt,
  resetAuthThrottle
} from "./auth-throttle";

const createdHouseholdIds = new Set<string>();
const createdAuthThrottleKeys = new Set<string>();

function uniqueUsername(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

function trackAuthThrottle(usernameNormalized: string, ipHash: string) {
  createdAuthThrottleKeys.add(`${usernameNormalized}\n${ipHash}`);
}

async function createTestHousehold(prefix = "repo") {
  const household = await createHouseholdWithPersonas({
    householdName: "Repository Test Home",
    usernameNormalized: uniqueUsername(prefix),
    timezone: "America/Chicago",
    passwordHash: `argon2id-test-hash-${randomUUID()}`,
    hashAlgorithm: "argon2id",
    hashParamsVersion: "test"
  });

  createdHouseholdIds.add(household.household.id);

  return household;
}

beforeAll(() => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for repository integration tests.");
  }
});

afterEach(async () => {
  const authThrottleKeys = [...createdAuthThrottleKeys];
  createdAuthThrottleKeys.clear();

  await Promise.all(
    authThrottleKeys.map((key) => {
      const [usernameNormalized, ipHash] = key.split("\n");

      return resetAuthThrottle({ usernameNormalized, ipHash });
    })
  );

  if (createdHouseholdIds.size === 0) {
    return;
  }

  await prisma.household.deleteMany({
    where: {
      id: {
        in: [...createdHouseholdIds]
      }
    }
  });
  createdHouseholdIds.clear();
});

describe("household and persona repositories", () => {
  test("creates a household with exactly one Alex and one Max persona", async () => {
    const result = await createTestHousehold("household");

    expect(result.household).toMatchObject({
      name: "Repository Test Home",
      timezone: "America/Chicago"
    });
    expect(result.personas.map((persona) => persona.key)).toEqual(["alex", "max"]);

    const personas = await listPersonasForHousehold(result.household.id);
    expect(personas).toHaveLength(2);
    expect(personas.map((persona) => persona.displayName)).toEqual(["Alex", "Max"]);
  });

  test("rejects a duplicate normalized household username", async () => {
    const usernameNormalized = uniqueUsername("duplicate");
    const first = await createHouseholdWithPersonas({
      householdName: "First Home",
      usernameNormalized,
      timezone: "America/Chicago",
      passwordHash: `argon2id-test-hash-${randomUUID()}`,
      hashAlgorithm: "argon2id",
      hashParamsVersion: "test"
    });
    createdHouseholdIds.add(first.household.id);

    await expect(
      createHouseholdWithPersonas({
        householdName: "Second Home",
        usernameNormalized,
        timezone: "America/Chicago",
        passwordHash: `argon2id-test-hash-${randomUUID()}`,
        hashAlgorithm: "argon2id",
        hashParamsVersion: "test"
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

describe("responsibility repository", () => {
  test("creates assignment history and derives current assignments", async () => {
    const { household, personas } = await createTestHousehold("responsibility");
    const [alex, max] = personas;

    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "Weekly meal outline",
      summary: "Sketch a practical meal plan.",
      areaKeys: ["food_flow"],
      hiddenEffortKeys: ["planning", "noticing"],
      cadence: "weekly",
      status: "active",
      visibility: "shared_household",
      householdStandard: "Keep it lightweight.",
      notes: null,
      nextReviewAt: null
    });

    await addResponsibilityAssignments({
      householdId: household.id,
      responsibilityId: responsibility.id,
      createdByPersonaId: alex.id,
      startsAt: "2026-05-01T12:00:00.000Z",
      assignments: [
        {
          personaId: alex.id,
          role: "accountable_owner",
          scope: "outcome"
        }
      ]
    });
    await addResponsibilityAssignments({
      householdId: household.id,
      responsibilityId: responsibility.id,
      createdByPersonaId: max.id,
      startsAt: "2026-05-10T12:00:00.000Z",
      assignments: [
        {
          personaId: max.id,
          role: "shared_owner",
          scope: "part"
        }
      ]
    });

    const detail = await getResponsibilityDetail({
      householdId: household.id,
      responsibilityId: responsibility.id
    });

    expect(detail?.currentAssignments).toEqual([
      {
        personaKey: "max",
        role: "shared_owner",
        scope: "part"
      }
    ]);
  });

  test("rejects assignment writes when responsibility and persona are from different households", async () => {
    const first = await createTestHousehold("responsibility-scope-a");
    const second = await createTestHousehold("responsibility-scope-b");
    const [firstAlex] = first.personas;
    const [secondAlex] = second.personas;
    const responsibility = await createResponsibility({
      householdId: first.household.id,
      createdByPersonaId: firstAlex.id,
      title: "Scope guarded task",
      summary: null,
      areaKeys: ["home_base"],
      hiddenEffortKeys: ["doing"],
      cadence: "weekly",
      status: "active",
      visibility: "shared_household",
      householdStandard: null,
      notes: null,
      nextReviewAt: null
    });

    await expect(
      addResponsibilityAssignments({
        householdId: first.household.id,
        responsibilityId: responsibility.id,
        createdByPersonaId: firstAlex.id,
        startsAt: "2026-05-01T12:00:00.000Z",
        assignments: [
          {
            personaId: secondAlex.id,
            role: "accountable_owner",
            scope: "outcome"
          }
        ]
      })
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });

    await expect(
      getResponsibilityDetail({
        householdId: second.household.id,
        responsibilityId: responsibility.id
      })
    ).resolves.toBeNull();
  });

  test("persists board placement changes and records lane movement events", async () => {
    const { household, personas } = await createTestHousehold("board-placement");
    const [alex] = personas;
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "Moveable card",
      summary: null,
      areaKeys: ["home_base"],
      hiddenEffortKeys: ["planning"],
      cadence: "weekly",
      status: "active",
      visibility: "shared_household",
      householdStandard: null,
      notes: null,
      nextReviewAt: null
    });

    const moved = await updateResponsibilityBoardPlacement({
      householdId: household.id,
      responsibilityId: responsibility.id,
      toLane: "player_1",
      sortOrder: 12,
      actorPersonaId: alex.id,
      note: "Alex is taking the whole card."
    });

    expect(moved).toMatchObject({
      id: responsibility.id,
      boardLane: "player_1",
      boardSortOrder: 12
    });
    await expect(
      prisma.responsibilityEvent.findMany({
        where: {
          responsibilityId: responsibility.id,
          eventType: "board_lane_changed"
        },
        select: {
          actorPersonaId: true,
          payload: true
        }
      })
    ).resolves.toEqual([
      {
        actorPersonaId: alex.id,
        payload: {
          fromLane: "cards_of_concern",
          toLane: "player_1",
          fromSortOrder: 0,
          toSortOrder: 12,
          note: "Alex is taking the whole card."
        }
      }
    ]);
  });

  test("atomically persists distribution status, handoff, assignment history, events, and placement", async () => {
    const { household, personas } = await createTestHousehold("card-distribution");
    const [alex, max] = personas;
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "Seasonal storage reset",
      summary: null,
      areaKeys: ["home_base"],
      hiddenEffortKeys: ["planning", "doing"],
      cadence: "seasonal",
      status: "active",
      visibility: "shared_household",
      householdStandard: null,
      notes: null,
      nextReviewAt: null,
      boardLane: "player_2",
      boardSortOrder: 3
    });
    await addResponsibilityAssignments({
      householdId: household.id,
      responsibilityId: responsibility.id,
      createdByPersonaId: max.id,
      startsAt: "2026-05-01T12:00:00.000Z",
      assignments: [
        {
          personaId: max.id,
          role: "accountable_owner",
          scope: "outcome"
        }
      ]
    });

    const moved = await applyResponsibilityCardDistribution({
      householdId: household.id,
      responsibilityId: responsibility.id,
      actorPersonaId: alex.id,
      status: "paused",
      targetOwnerPersonaKey: null,
      toLane: "not_in_play",
      sortOrder: 8,
      effectiveAt: "2026-05-10T12:00:00.000Z",
      handoffNotes: "Moved through card distribution.",
      revisitAt: "2026-05-17T12:00:00.000Z"
    });

    expect(moved).toMatchObject({
      id: responsibility.id,
      status: "paused",
      boardLane: "not_in_play",
      boardSortOrder: 8,
      currentAssignments: []
    });

    const events = await prisma.responsibilityEvent.findMany({
      where: {
        responsibilityId: responsibility.id
      },
      select: {
        eventType: true,
        payload: true
      }
    });

    expect(events).toHaveLength(3);
    expect(events).toEqual(
      expect.arrayContaining([
        {
          eventType: "status_changed",
          payload: {
            status: "paused",
            note: null,
            reviewOn: null
          }
        },
        {
          eventType: "assignment_changed",
          payload: {
            assignments: [],
            handoffNotes: "Moved through card distribution.",
            revisitAt: "2026-05-17T12:00:00.000Z"
          }
        },
        {
          eventType: "board_lane_changed",
          payload: {
            fromLane: "player_2",
            toLane: "not_in_play",
            fromSortOrder: 3,
            toSortOrder: 8,
            note: null
          }
        }
      ])
    );
  });

  test("serializes concurrent distribution moves so one current owner matches the final lane", async () => {
    const { household, personas } = await createTestHousehold(
      "card-distribution-concurrent"
    );
    const [alex, max] = personas;
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "Concurrent move card",
      summary: null,
      areaKeys: ["home_base"],
      hiddenEffortKeys: ["planning"],
      cadence: "weekly",
      status: "unassigned",
      visibility: "shared_household",
      householdStandard: null,
      notes: null,
      nextReviewAt: null
    });
    const commonMove = {
      householdId: household.id,
      responsibilityId: responsibility.id,
      status: "active" as const,
      sortOrder: 0,
      effectiveAt: "2026-05-10T12:00:00.000Z",
      handoffNotes: "Moved through card distribution.",
      revisitAt: "2026-05-17T12:00:00.000Z"
    };

    await Promise.all([
      applyResponsibilityCardDistribution({
        ...commonMove,
        actorPersonaId: alex.id,
        targetOwnerPersonaKey: "alex",
        toLane: "player_1"
      }),
      applyResponsibilityCardDistribution({
        ...commonMove,
        actorPersonaId: max.id,
        targetOwnerPersonaKey: "max",
        toLane: "player_2"
      })
    ]);

    const detail = await getResponsibilityDetail({
      householdId: household.id,
      responsibilityId: responsibility.id
    });
    const finalOwner = detail?.currentAssignments[0]?.personaKey;

    expect(detail?.currentAssignments).toHaveLength(1);
    expect(["alex", "max"]).toContain(finalOwner);
    expect(detail?.boardLane).toBe(
      finalOwner === "alex" ? "player_1" : "player_2"
    );
    await expect(
      prisma.responsibilityAssignment.count({
        where: {
          responsibilityId: responsibility.id,
          endsAt: null
        }
      })
    ).resolves.toBe(1);
  });

  test("rolls back the entire distribution when a later placement write fails", async () => {
    const { household, personas } = await createTestHousehold(
      "card-distribution-rollback"
    );
    const [alex] = personas;
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "Rollback protected card",
      summary: null,
      areaKeys: ["home_base"],
      hiddenEffortKeys: ["planning"],
      cadence: "weekly",
      status: "unassigned",
      visibility: "shared_household",
      householdStandard: null,
      notes: null,
      nextReviewAt: null
    });

    await expect(
      applyResponsibilityCardDistribution({
        householdId: household.id,
        responsibilityId: responsibility.id,
        actorPersonaId: alex.id,
        status: "active",
        targetOwnerPersonaKey: "alex",
        toLane: "invalid_lane" as ResponsibilityBoardLane,
        sortOrder: 12,
        effectiveAt: "2026-05-10T12:00:00.000Z"
      })
    ).rejects.toThrow();

    await expect(
      getResponsibilityDetail({
        householdId: household.id,
        responsibilityId: responsibility.id
      })
    ).resolves.toMatchObject({
      status: "unassigned",
      boardLane: "cards_of_concern",
      boardSortOrder: 0,
      currentAssignments: []
    });
    await expect(
      prisma.responsibilityAssignment.count({
        where: {
          responsibilityId: responsibility.id
        }
      })
    ).resolves.toBe(0);
    await expect(
      prisma.responsibilityEvent.count({
        where: {
          responsibilityId: responsibility.id
        }
      })
    ).resolves.toBe(0);
  });
});

describe("check-in repository", () => {
  test("creates a check-in, records an item decision, and returns a completed summary", async () => {
    const { household, personas } = await createTestHousehold("check-in");
    const [alex] = personas;
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "Review supply restock",
      summary: null,
      areaKeys: ["food_flow"],
      hiddenEffortKeys: ["noticing"],
      cadence: "weekly",
      status: "needs_review",
      visibility: "shared_household",
      householdStandard: null,
      notes: null,
      nextReviewAt: "2026-05-12T00:00:00.000Z"
    });

    const agenda = await createCheckIn({
      householdId: household.id,
      facilitatorPersonaId: alex.id,
      scheduledFor: "2026-05-12T15:00:00.000Z",
      responsibilityIds: [responsibility.id]
    });

    const updatedItem = await recordCheckInItemDecision({
      householdId: household.id,
      checkInId: agenda.id,
      itemId: agenda.items[0].id,
      createdByPersonaId: alex.id,
      state: "discussed",
      response: "Agree to restock on Fridays.",
      decision: {
        decisionType: "custom_note",
        summary: "Restock review moved to Friday routine.",
        effectiveAt: "2026-05-12T16:00:00.000Z",
        reviewOn: null,
        responsibilityId: responsibility.id
      }
    });

    expect(updatedItem.state).toBe("discussed");

    const completed = await completeCheckIn({
      householdId: household.id,
      id: agenda.id,
      completedAt: "2026-05-12T16:15:00.000Z",
      summary: "One decision recorded."
    });

    expect(completed).toMatchObject({
      id: agenda.id,
      state: "completed",
      completedAt: "2026-05-12T16:15:00.000Z",
      summary: "One decision recorded.",
      discussedItemCount: 1,
      decisionCount: 1
    });
  });

  test("rejects check-in writes when related ids belong to another household", async () => {
    const first = await createTestHousehold("check-in-scope-a");
    const second = await createTestHousehold("check-in-scope-b");
    const [firstAlex] = first.personas;
    const [secondAlex] = second.personas;
    const secondResponsibility = await createResponsibility({
      householdId: second.household.id,
      createdByPersonaId: secondAlex.id,
      title: "Second household card",
      summary: null,
      areaKeys: ["home_base"],
      hiddenEffortKeys: ["planning"],
      cadence: "weekly",
      status: "active",
      visibility: "shared_household",
      householdStandard: null,
      notes: null,
      nextReviewAt: null
    });

    await expect(
      createCheckIn({
        householdId: first.household.id,
        facilitatorPersonaId: firstAlex.id,
        scheduledFor: null,
        responsibilityIds: [secondResponsibility.id]
      })
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });

    const agenda = await createCheckIn({
      householdId: first.household.id,
      facilitatorPersonaId: firstAlex.id,
      scheduledFor: null,
      responsibilityIds: []
    });

    await expect(
      recordCheckInItemDecision({
        householdId: second.household.id,
        checkInId: agenda.id,
        itemId: "00000000-0000-4000-8000-000000000001",
        createdByPersonaId: secondAlex.id,
        state: "discussed",
        response: null,
        decision: null
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await expect(
      completeCheckIn({
        householdId: second.household.id,
        id: agenda.id,
        completedAt: "2026-05-12T16:15:00.000Z",
        summary: null
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("session repository", () => {
  test("rejects persona selection and revocation across households", async () => {
    const first = await createTestHousehold("session-scope-a");
    const second = await createTestHousehold("session-scope-b");
    const [secondAlex] = second.personas;
    const session = await createSession({
      householdId: first.household.id,
      tokenHash: `token-${randomUUID()}`,
      expiresAt: "2026-06-01T00:00:00.000Z"
    });

    await expect(
      selectSessionPersona({
        sessionId: session.id,
        householdId: first.household.id,
        selectedPersonaId: secondAlex.id
      })
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });

    await expect(
      revokeSession({
        householdId: second.household.id,
        sessionId: session.id
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("auth throttle repository", () => {
  test("records repeated failed attempts and throttles at the configured threshold", async () => {
    const usernameNormalized = uniqueUsername("auth-throttle-repeat");
    const ipHash = `ip-${randomUUID()}`;
    trackAuthThrottle(usernameNormalized, ipHash);

    const first = await recordFailedLoginAttempt({
      usernameNormalized,
      ipHash,
      attemptedAt: "2026-05-04T12:00:00.000Z",
      throttleAfterAttempts: 3,
      throttleForMs: 60_000
    });
    const second = await recordFailedLoginAttempt({
      usernameNormalized,
      ipHash,
      attemptedAt: "2026-05-04T12:01:00.000Z",
      throttleAfterAttempts: 3,
      throttleForMs: 60_000
    });
    const third = await recordFailedLoginAttempt({
      usernameNormalized,
      ipHash,
      attemptedAt: "2026-05-04T12:02:00.000Z",
      throttleAfterAttempts: 3,
      throttleForMs: 60_000
    });

    expect(first).toMatchObject({
      failedAttemptCount: 1,
      throttledUntil: null
    });
    expect(second).toMatchObject({
      failedAttemptCount: 2,
      throttledUntil: null
    });
    expect(third).toMatchObject({
      failedAttemptCount: 3,
      throttledUntil: "2026-05-04T12:03:00.000Z"
    });

    await expect(getAuthThrottle({ usernameNormalized, ipHash })).resolves.toMatchObject({
      failedAttemptCount: 3,
      throttledUntil: "2026-05-04T12:03:00.000Z"
    });
  });

  test("does not lose failed attempts recorded concurrently", async () => {
    const usernameNormalized = uniqueUsername("auth-throttle-concurrent");
    const ipHash = `ip-${randomUUID()}`;
    const attemptCount = 8;
    trackAuthThrottle(usernameNormalized, ipHash);

    await Promise.all(
      Array.from({ length: attemptCount }, () =>
        recordFailedLoginAttempt({
          usernameNormalized,
          ipHash,
          attemptedAt: "2026-05-04T12:00:00.000Z",
          throttleAfterAttempts: 5,
          throttleForMs: 15 * 60 * 1000
        })
      )
    );

    await expect(getAuthThrottle({ usernameNormalized, ipHash })).resolves.toMatchObject({
      failedAttemptCount: attemptCount,
      throttledUntil: "2026-05-04T12:15:00.000Z"
    });
  });
});

describe("load snapshot repository", () => {
  test("computes and stores aggregate load snapshots without score fields", async () => {
    const { household, personas } = await createTestHousehold("load");
    const [alex] = personas;
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "Supply restock",
      summary: null,
      areaKeys: ["food_flow", "fix_and_fetch"],
      hiddenEffortKeys: ["noticing", "planning"],
      cadence: "as_needed",
      status: "active",
      visibility: "shared_household",
      householdStandard: null,
      notes: null,
      nextReviewAt: "2026-05-01T00:00:00.000Z"
    });
    await addResponsibilityAssignments({
      householdId: household.id,
      responsibilityId: responsibility.id,
      createdByPersonaId: alex.id,
      startsAt: "2026-05-01T12:00:00.000Z",
      assignments: [
        {
          personaId: alex.id,
          role: "accountable_owner",
          scope: "outcome"
        }
      ]
    });
    const snapshot = await computeAndStoreLoadSnapshot({
      householdId: household.id,
      periodStart: "2026-05-01T00:00:00.000Z",
      periodEnd: "2026-05-31T23:59:59.000Z",
      asOf: "2026-05-20T00:00:00.000Z"
    });
    const serialized = JSON.stringify(snapshot);

    expect(snapshot.ownerDistribution).toMatchObject({ alex: 1 });
    expect(snapshot.reviewDueCount).toBe(1);
    expect(serialized).not.toMatch(/score|winner|loser/i);
  });
});
