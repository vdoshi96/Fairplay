import { randomUUID } from "node:crypto";

import type { ResponsibilityBoardLane } from "@prisma/client";
import { afterEach, beforeAll, describe, expect, test } from "vitest";

import { computeHouseholdWorkMap } from "../../domain/household-work-map";
import { prisma } from "../db/prisma";
import { createHouseholdWithPersonas } from "./households";
import { listPersonasForHousehold } from "./personas";
import {
  addResponsibilityAssignments,
  applyResponsibilityAssignmentRevision,
  applyResponsibilityCardDistribution,
  applyResponsibilityOwnershipAgreement,
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

  test("atomically activates a first ownership agreement and makes it eligible for the work map", async () => {
    const { household, personas } = await createTestHousehold(
      "ownership-first-activation"
    );
    const [alex] = personas;
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "First ownership card",
      summary: null,
      areaKeys: ["home_base"],
      hiddenEffortKeys: ["planning"],
      cadence: "weekly",
      status: "unassigned",
      visibility: "shared_household",
      boardLane: "cards_of_concern",
      nextReviewAt: null
    });

    const updated = await applyResponsibilityOwnershipAgreement({
      householdId: household.id,
      responsibilityId: responsibility.id,
      actorPersonaId: alex.id,
      expectedUpdatedAt: responsibility.updatedAt,
      expectedOwnerPersonaKeys: [],
      assignments: [
        { personaKey: "max", role: "accountable_owner", scope: "outcome" }
      ],
      reviewAt: null
    });

    expect(updated).toMatchObject({
      status: "active",
      boardLane: "player_2",
      currentAssignments: [
        { personaKey: "max", role: "accountable_owner", scope: "outcome" }
      ]
    });
    expect(
      computeHouseholdWorkMap({ responsibilities: [updated] })
    ).toMatchObject({
      personas: {
        max: {
          owned: 1,
          highFrequency: 1,
          hiddenEffort: { planning: 1 }
        }
      },
      household: {
        unassigned: 0
      }
    });

    const events = await prisma.responsibilityEvent.findMany({
      where: { responsibilityId: responsibility.id },
      select: { eventType: true, payload: true }
    });
    expect(events).toHaveLength(3);
    expect(events).toEqual(
      expect.arrayContaining([
        {
          eventType: "assignment_changed",
          payload: expect.objectContaining({
            assignments: [
              {
                personaKey: "max",
                role: "accountable_owner",
                scope: "outcome"
              }
            ],
            formerOwnerPersonaKeys: []
          })
        },
        {
          eventType: "status_changed",
          payload: {
            status: "active",
            note: null,
            reviewOn: null
          }
        },
        {
          eventType: "board_lane_changed",
          payload: {
            fromLane: "cards_of_concern",
            toLane: "player_2",
            fromSortOrder: 0,
            toSortOrder: 0,
            note: null
          }
        }
      ])
    );
  });

  test.each(["paused", "not_relevant"] as const)(
    "preserves %s when adding a first owner",
    async (status) => {
      const { household, personas } = await createTestHousehold(
        `ownership-preserve-${status}`
      );
      const [alex] = personas;
      const responsibility = await createResponsibility({
        householdId: household.id,
        createdByPersonaId: alex.id,
        title: `Preserve ${status} card`,
        summary: null,
        areaKeys: ["home_base"],
        hiddenEffortKeys: ["planning"],
        cadence: "weekly",
        status,
        visibility: "shared_household",
        boardLane: "cards_of_concern",
        nextReviewAt: null
      });

      const updated = await applyResponsibilityOwnershipAgreement({
        householdId: household.id,
        responsibilityId: responsibility.id,
        actorPersonaId: alex.id,
        expectedUpdatedAt: responsibility.updatedAt,
        expectedOwnerPersonaKeys: [],
        assignments: [
          { personaKey: "alex", role: "accountable_owner", scope: "outcome" }
        ],
        reviewAt: null
      });

      expect(updated).toMatchObject({
        status,
        boardLane: "player_1",
        currentAssignments: [
          { personaKey: "alex", role: "accountable_owner", scope: "outcome" }
        ]
      });
      await expect(
        prisma.responsibilityEvent.count({
          where: {
            responsibilityId: responsibility.id,
            eventType: "status_changed"
          }
        })
      ).resolves.toBe(0);
    }
  );

  test("atomically replaces a former owner and records the ownership agreement", async () => {
    const { household, personas } = await createTestHousehold("ownership-replace");
    const [alex, max] = personas;
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "Replace ownership card",
      summary: null,
      areaKeys: ["home_base"],
      hiddenEffortKeys: ["planning"],
      cadence: "weekly",
      status: "active",
      visibility: "shared_household",
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

    const updated = await applyResponsibilityOwnershipAgreement({
      householdId: household.id,
      responsibilityId: responsibility.id,
      actorPersonaId: alex.id,
      expectedUpdatedAt: responsibility.updatedAt,
      expectedOwnerPersonaKeys: ["alex"],
      assignments: [
        { personaKey: "max", role: "accountable_owner", scope: "outcome" }
      ],
      reviewAt: "2026-08-01T12:00:00.000Z",
      handoffMode: "replace_former_owner",
      handoffNotes: "Max has the plan and supply context."
    });

    expect(updated).toMatchObject({
      id: responsibility.id,
      boardLane: "player_2",
      nextReviewAt: "2026-08-01T12:00:00.000Z",
      currentAssignments: [
        { personaKey: "max", role: "accountable_owner", scope: "outcome" }
      ]
    });
    const history = await prisma.responsibilityAssignment.findMany({
      where: { responsibilityId: responsibility.id },
      orderBy: { createdAt: "asc" },
      select: { personaId: true, startsAt: true, endsAt: true }
    });
    expect(history).toHaveLength(2);
    expect(history[0]).toMatchObject({ personaId: alex.id });
    expect(history[0]?.endsAt?.getTime()).toBeGreaterThanOrEqual(
      history[0]?.startsAt.getTime() ?? Number.POSITIVE_INFINITY
    );
    expect(history[1]).toMatchObject({ personaId: max.id, endsAt: null });
    await expect(
      prisma.responsibilityEvent.findFirstOrThrow({
        where: {
          responsibilityId: responsibility.id,
          eventType: "assignment_changed"
        },
        select: { payload: true }
      })
    ).resolves.toMatchObject({
      payload: {
        assignments: [
          { personaKey: "max", role: "accountable_owner", scope: "outcome" }
        ],
        formerOwnerPersonaKeys: ["alex"],
        handoffMode: "replace_former_owner",
        handoffNotes: "Max has the plan and supply context.",
        reviewAt: "2026-08-01T12:00:00.000Z",
        revisitAt: "2026-08-01T12:00:00.000Z"
      }
    });
    await expect(
      prisma.responsibilityEvent.findFirstOrThrow({
        where: {
          responsibilityId: responsibility.id,
          eventType: "board_lane_changed"
        },
        select: { payload: true }
      })
    ).resolves.toEqual({
      payload: {
        fromLane: "cards_of_concern",
        toLane: "player_2",
        fromSortOrder: 0,
        toSortOrder: 0,
        note: null
      }
    });
  });

  test("atomically returns an owned card to Deal with assignment, status, and lane events", async () => {
    const { household, personas } = await createTestHousehold("ownership-return-deal");
    const [alex] = personas;
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "Return ownership card",
      summary: null,
      areaKeys: ["home_base"],
      hiddenEffortKeys: ["planning"],
      cadence: "weekly",
      status: "active",
      visibility: "shared_household",
      boardLane: "player_1",
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

    const updated = await applyResponsibilityOwnershipAgreement({
      householdId: household.id,
      responsibilityId: responsibility.id,
      actorPersonaId: alex.id,
      expectedUpdatedAt: responsibility.updatedAt,
      expectedOwnerPersonaKeys: ["alex"],
      assignments: [],
      reviewAt: null,
      handoffMode: "replace_former_owner",
      handoffNotes: "Put this card back in the household deal pool."
    });

    expect(updated).toMatchObject({
      boardLane: "cards_of_concern",
      status: "unassigned",
      currentAssignments: []
    });
    await expect(
      prisma.responsibilityAssignment.findMany({
        where: { responsibilityId: responsibility.id, endsAt: null }
      })
    ).resolves.toEqual([]);

    const events = await prisma.responsibilityEvent.findMany({
      where: { responsibilityId: responsibility.id },
      select: { eventType: true, payload: true }
    });
    expect(events).toHaveLength(3);
    expect(events).toEqual(
      expect.arrayContaining([
        {
          eventType: "assignment_changed",
          payload: expect.objectContaining({
            assignments: [],
            formerOwnerPersonaKeys: ["alex"],
            handoffMode: "replace_former_owner",
            handoffNotes: "Put this card back in the household deal pool."
          })
        },
        {
          eventType: "status_changed",
          payload: {
            status: "unassigned",
            note: null,
            reviewOn: null
          }
        },
        {
          eventType: "board_lane_changed",
          payload: {
            fromLane: "player_1",
            toLane: "cards_of_concern",
            fromSortOrder: 0,
            toSortOrder: 0,
            note: null
          }
        }
      ])
    );
  });

  test("returns a card to Deal with a helper only through retain-former handoff", async () => {
    const { household, personas } = await createTestHousehold(
      "ownership-return-helper"
    );
    const [alex] = personas;
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "Return ownership context card",
      summary: null,
      areaKeys: ["home_base"],
      hiddenEffortKeys: ["planning"],
      cadence: "weekly",
      status: "active",
      visibility: "shared_household",
      boardLane: "player_1",
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

    const updated = await applyResponsibilityOwnershipAgreement({
      householdId: household.id,
      responsibilityId: responsibility.id,
      actorPersonaId: alex.id,
      expectedUpdatedAt: responsibility.updatedAt,
      expectedOwnerPersonaKeys: ["alex"],
      assignments: [],
      reviewAt: null,
      handoffMode: "retain_former_owner_as_helper"
    });

    expect(updated).toMatchObject({
      boardLane: "cards_of_concern",
      status: "unassigned",
      currentAssignments: [
        { personaKey: "alex", role: "helper", scope: "support" }
      ]
    });
  });

  test("rejects ownerless first agreements and manually helper-only returns", async () => {
    const { household, personas } = await createTestHousehold(
      "ownership-ownerless-guard"
    );
    const [alex] = personas;
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "Ownerless guard card",
      summary: null,
      areaKeys: ["home_base"],
      hiddenEffortKeys: ["planning"],
      cadence: "weekly",
      status: "unassigned",
      visibility: "shared_household",
      nextReviewAt: null
    });

    await expect(
      applyResponsibilityOwnershipAgreement({
        householdId: household.id,
        responsibilityId: responsibility.id,
        actorPersonaId: alex.id,
        expectedUpdatedAt: responsibility.updatedAt,
        expectedOwnerPersonaKeys: [],
        assignments: [],
        reviewAt: null,
        handoffMode: "replace_former_owner"
      })
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });

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
    await expect(
      applyResponsibilityOwnershipAgreement({
        householdId: household.id,
        responsibilityId: responsibility.id,
        actorPersonaId: alex.id,
        expectedUpdatedAt: responsibility.updatedAt,
        expectedOwnerPersonaKeys: ["alex"],
        assignments: [
          { personaKey: "max", role: "helper", scope: "support" }
        ],
        reviewAt: null,
        handoffMode: "retain_former_owner_as_helper"
      })
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  test("retains a former owner explicitly as a helper", async () => {
    const { household, personas } = await createTestHousehold("ownership-retain");
    const [alex, max] = personas;
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "Retain ownership context card",
      summary: null,
      areaKeys: ["home_base"],
      hiddenEffortKeys: ["planning"],
      cadence: "weekly",
      status: "active",
      visibility: "shared_household",
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

    const updated = await applyResponsibilityOwnershipAgreement({
      householdId: household.id,
      responsibilityId: responsibility.id,
      actorPersonaId: max.id,
      expectedUpdatedAt: responsibility.updatedAt,
      expectedOwnerPersonaKeys: ["alex"],
      assignments: [
        { personaKey: "max", role: "accountable_owner", scope: "outcome" }
      ],
      reviewAt: null,
      handoffMode: "retain_former_owner_as_helper"
    });

    expect(updated.currentAssignments).toEqual(
      expect.arrayContaining([
        { personaKey: "max", role: "accountable_owner", scope: "outcome" },
        { personaKey: "alex", role: "helper", scope: "support" }
      ])
    );
    expect(updated.currentAssignments).toHaveLength(2);
    expect(updated.boardLane).toBe("player_2");
  });

  test("keeps the persisted lane stable for a genuine shared-owner agreement", async () => {
    const { household, personas } = await createTestHousehold("ownership-shared");
    const [alex] = personas;
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "Shared ownership card",
      summary: null,
      areaKeys: ["home_base"],
      hiddenEffortKeys: ["planning"],
      cadence: "weekly",
      status: "active",
      visibility: "shared_household",
      boardLane: "player_1",
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

    const updated = await applyResponsibilityOwnershipAgreement({
      householdId: household.id,
      responsibilityId: responsibility.id,
      actorPersonaId: alex.id,
      expectedUpdatedAt: responsibility.updatedAt,
      expectedOwnerPersonaKeys: ["alex"],
      assignments: [
        { personaKey: "alex", role: "shared_owner", scope: "outcome" },
        { personaKey: "max", role: "shared_owner", scope: "outcome" }
      ],
      reviewAt: null
    });

    expect(updated.boardLane).toBe("player_1");
    expect(updated.currentAssignments).toEqual(
      expect.arrayContaining([
        { personaKey: "alex", role: "shared_owner", scope: "outcome" },
        { personaKey: "max", role: "shared_owner", scope: "outcome" }
      ])
    );
    await expect(
      prisma.responsibilityEvent.count({
        where: {
          responsibilityId: responsibility.id,
          eventType: "board_lane_changed"
        }
      })
    ).resolves.toBe(0);
  });

  test("rejects silent former-owner removal without changing the agreement", async () => {
    const { household, personas } = await createTestHousehold("ownership-explicit");
    const [alex] = personas;
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "Explicit handoff card",
      summary: null,
      areaKeys: ["home_base"],
      hiddenEffortKeys: ["planning"],
      cadence: "weekly",
      status: "active",
      visibility: "shared_household",
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

    await expect(
      applyResponsibilityOwnershipAgreement({
        householdId: household.id,
        responsibilityId: responsibility.id,
        actorPersonaId: alex.id,
        expectedUpdatedAt: responsibility.updatedAt,
        expectedOwnerPersonaKeys: ["alex"],
        assignments: [
          { personaKey: "max", role: "accountable_owner", scope: "outcome" }
        ],
        reviewAt: "2026-08-01T12:00:00.000Z"
      })
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });

    await expect(
      getResponsibilityDetail({
        householdId: household.id,
        responsibilityId: responsibility.id
      })
    ).resolves.toMatchObject({
      nextReviewAt: null,
      currentAssignments: [
        { personaKey: "alex", role: "accountable_owner", scope: "outcome" }
      ]
    });
    await expect(
      prisma.responsibilityEvent.count({
        where: { responsibilityId: responsibility.id }
      })
    ).resolves.toBe(0);
  });

  test("rolls back ownership history and review when a later write fails", async () => {
    const { household, personas } = await createTestHousehold("ownership-rollback");
    const [alex] = personas;
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "Ownership rollback card",
      summary: null,
      areaKeys: ["home_base"],
      hiddenEffortKeys: ["planning"],
      cadence: "weekly",
      status: "active",
      visibility: "shared_household",
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

    await expect(
      applyResponsibilityOwnershipAgreement({
        householdId: household.id,
        responsibilityId: responsibility.id,
        actorPersonaId: alex.id,
        expectedUpdatedAt: responsibility.updatedAt,
        expectedOwnerPersonaKeys: ["alex"],
        assignments: [
          { personaKey: "alex", role: "accountable_owner", scope: "outcome" },
          {
            personaKey: "max",
            role: "invalid_role" as "helper",
            scope: "support"
          }
        ],
        reviewAt: "2026-08-01T12:00:00.000Z"
      })
    ).rejects.toThrow();

    const current = await getResponsibilityDetail({
      householdId: household.id,
      responsibilityId: responsibility.id
    });
    expect(current).toMatchObject({
      nextReviewAt: null,
      currentAssignments: [
        { personaKey: "alex", role: "accountable_owner", scope: "outcome" }
      ]
    });
    await expect(
      prisma.responsibilityAssignment.count({
        where: { responsibilityId: responsibility.id }
      })
    ).resolves.toBe(1);
    await expect(
      prisma.responsibilityEvent.count({
        where: { responsibilityId: responsibility.id }
      })
    ).resolves.toBe(0);
  });

  test("serializes concurrent first agreements and prevents a stale silent handoff", async () => {
    const { household, personas } = await createTestHousehold(
      "ownership-concurrent"
    );
    const [alex, max] = personas;
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "Concurrent ownership card",
      summary: null,
      areaKeys: ["home_base"],
      hiddenEffortKeys: ["planning"],
      cadence: "weekly",
      status: "active",
      visibility: "shared_household",
      nextReviewAt: null
    });

    const results = await Promise.allSettled([
      applyResponsibilityOwnershipAgreement({
        householdId: household.id,
        responsibilityId: responsibility.id,
        actorPersonaId: alex.id,
        expectedUpdatedAt: responsibility.updatedAt,
        expectedOwnerPersonaKeys: [],
        assignments: [
          { personaKey: "alex", role: "accountable_owner", scope: "outcome" }
        ],
        reviewAt: null
      }),
      applyResponsibilityOwnershipAgreement({
        householdId: household.id,
        responsibilityId: responsibility.id,
        actorPersonaId: max.id,
        expectedUpdatedAt: responsibility.updatedAt,
        expectedOwnerPersonaKeys: [],
        assignments: [
          { personaKey: "max", role: "accountable_owner", scope: "outcome" }
        ],
        reviewAt: null
      })
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    const current = await getResponsibilityDetail({
      householdId: household.id,
      responsibilityId: responsibility.id
    });
    expect(current?.currentAssignments).toHaveLength(1);
    expect(["alex", "max"]).toContain(
      current?.currentAssignments[0]?.personaKey
    );
    await expect(
      prisma.responsibilityEvent.count({
        where: {
          responsibilityId: responsibility.id,
          eventType: "assignment_changed"
        }
      })
    ).resolves.toBe(1);
  });

  test("rejects a concurrent same-owner helper or review edit from a stale revision", async () => {
    const { household, personas } = await createTestHousehold(
      "ownership-concurrent-same-owner"
    );
    const [alex, max] = personas;
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "Concurrent ownership detail card",
      summary: null,
      areaKeys: ["home_base"],
      hiddenEffortKeys: ["planning"],
      cadence: "weekly",
      status: "active",
      visibility: "shared_household",
      nextReviewAt: null
    });
    const assigned = await addResponsibilityAssignments({
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

    const results = await Promise.allSettled([
      applyResponsibilityOwnershipAgreement({
        householdId: household.id,
        responsibilityId: responsibility.id,
        actorPersonaId: alex.id,
        expectedUpdatedAt: assigned.updatedAt,
        expectedOwnerPersonaKeys: ["alex"],
        assignments: [
          { personaKey: "alex", role: "accountable_owner", scope: "outcome" },
          { personaKey: "max", role: "helper", scope: "support" }
        ],
        reviewAt: "2026-08-01T12:00:00.000Z"
      }),
      applyResponsibilityOwnershipAgreement({
        householdId: household.id,
        responsibilityId: responsibility.id,
        actorPersonaId: max.id,
        expectedUpdatedAt: assigned.updatedAt,
        expectedOwnerPersonaKeys: ["alex"],
        assignments: [
          { personaKey: "alex", role: "accountable_owner", scope: "outcome" },
          { personaKey: "max", role: "backup", scope: "temporary" }
        ],
        reviewAt: "2026-09-01T12:00:00.000Z"
      })
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected).toMatchObject({
      status: "rejected",
      reason: { code: "CONFLICT" }
    });

    const current = await getResponsibilityDetail({
      householdId: household.id,
      responsibilityId: responsibility.id
    });
    expect(current?.currentAssignments).toHaveLength(2);
    expect(current?.currentAssignments).toEqual(
      expect.arrayContaining([
        { personaKey: "alex", role: "accountable_owner", scope: "outcome" }
      ])
    );
    expect(["2026-08-01T12:00:00.000Z", "2026-09-01T12:00:00.000Z"]).toContain(
      current?.nextReviewAt
    );
    await expect(
      prisma.responsibilityEvent.count({
        where: {
          responsibilityId: responsibility.id,
          eventType: "assignment_changed"
        }
      })
    ).resolves.toBe(1);
  });

  test("prevents a concurrently opened ownership agreement from erasing a newer helper edit", async () => {
    const { household, personas } = await createTestHousehold(
      "ownership-legacy-helper-cas"
    );
    const [alex, max] = personas;
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "Legacy helper revision card",
      summary: null,
      areaKeys: ["home_base"],
      hiddenEffortKeys: ["planning"],
      cadence: "weekly",
      status: "active",
      visibility: "shared_household",
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

    // This revision represents an ownership sheet that was already open when
    // the compatibility/check-in path added a helper.
    const openedAgreementRevision = responsibility.updatedAt;
    const helperEdit = await applyResponsibilityAssignmentRevision({
      householdId: household.id,
      responsibilityId: responsibility.id,
      actorPersonaId: max.id,
      expectedUpdatedAt: openedAgreementRevision,
      expectedOwnerPersonaKeys: ["alex"],
      effectiveAt: "2026-05-10T12:00:00.000Z",
      assignments: [
        {
          personaId: alex.id,
          personaKey: "alex",
          role: "accountable_owner",
          scope: "outcome"
        },
        {
          personaId: max.id,
          personaKey: "max",
          role: "helper",
          scope: "support"
        }
      ],
      handoffNotes: "Max has the supply context.",
      revisitAt: "2026-06-01T12:00:00.000Z"
    });

    expect(new Date(helperEdit.updatedAt).getTime()).toBeGreaterThan(
      new Date(openedAgreementRevision).getTime()
    );
    await expect(
      applyResponsibilityOwnershipAgreement({
        householdId: household.id,
        responsibilityId: responsibility.id,
        actorPersonaId: alex.id,
        expectedUpdatedAt: openedAgreementRevision,
        expectedOwnerPersonaKeys: ["alex"],
        assignments: [
          { personaKey: "alex", role: "accountable_owner", scope: "outcome" }
        ],
        reviewAt: "2026-08-01T12:00:00.000Z"
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });

    await expect(
      getResponsibilityDetail({
        householdId: household.id,
        responsibilityId: responsibility.id
      })
    ).resolves.toMatchObject({
      updatedAt: helperEdit.updatedAt,
      nextReviewAt: null,
      currentAssignments: expect.arrayContaining([
        { personaKey: "alex", role: "accountable_owner", scope: "outcome" },
        { personaKey: "max", role: "helper", scope: "support" }
      ])
    });
    await expect(
      prisma.responsibilityEvent.findMany({
        where: {
          responsibilityId: responsibility.id,
          eventType: "assignment_changed"
        },
        select: { payload: true }
      })
    ).resolves.toEqual([
      {
        payload: {
          assignments: [
            {
              personaKey: "alex",
              role: "accountable_owner",
              scope: "outcome"
            },
            { personaKey: "max", role: "helper", scope: "support" }
          ],
          handoffNotes: "Max has the supply context.",
          revisitAt: "2026-06-01T12:00:00.000Z"
        }
      }
    ]);
  });

  test("rejects a stale handoff even when both concurrent requests chose a mode", async () => {
    const { household, personas } = await createTestHousehold(
      "ownership-concurrent-handoff"
    );
    const [alex, max] = personas;
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "Concurrent explicit handoff card",
      summary: null,
      areaKeys: ["home_base"],
      hiddenEffortKeys: ["planning"],
      cadence: "weekly",
      status: "active",
      visibility: "shared_household",
      boardLane: "player_1",
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

    const results = await Promise.allSettled([
      applyResponsibilityOwnershipAgreement({
        householdId: household.id,
        responsibilityId: responsibility.id,
        actorPersonaId: alex.id,
        expectedUpdatedAt: responsibility.updatedAt,
        expectedOwnerPersonaKeys: ["alex"],
        assignments: [
          { personaKey: "max", role: "accountable_owner", scope: "outcome" }
        ],
        reviewAt: null,
        handoffMode: "replace_former_owner"
      }),
      applyResponsibilityOwnershipAgreement({
        householdId: household.id,
        responsibilityId: responsibility.id,
        actorPersonaId: max.id,
        expectedUpdatedAt: responsibility.updatedAt,
        expectedOwnerPersonaKeys: ["alex"],
        assignments: [
          { personaKey: "max", role: "accountable_owner", scope: "part" }
        ],
        reviewAt: null,
        handoffMode: "replace_former_owner"
      })
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected).toMatchObject({
      status: "rejected",
      reason: { code: "CONFLICT" }
    });
    await expect(
      getResponsibilityDetail({
        householdId: household.id,
        responsibilityId: responsibility.id
      })
    ).resolves.toMatchObject({
      boardLane: "player_2",
      currentAssignments: [
        {
          personaKey: "max",
          role: "accountable_owner"
        }
      ]
    });
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

  test("rejects an ownership-changing quick move without mutating the card", async () => {
    const { household, personas } = await createTestHousehold(
      "card-distribution-owned-guard"
    );
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
        },
        {
          personaId: alex.id,
          role: "helper",
          scope: "support"
        }
      ]
    });

    const eventCountBeforeMove = await prisma.responsibilityEvent.count({
      where: { responsibilityId: responsibility.id }
    });

    await expect(
      applyResponsibilityCardDistribution({
        householdId: household.id,
        responsibilityId: responsibility.id,
        actorPersonaId: alex.id,
        status: "paused",
        targetOwnerPersonaKey: null,
        toLane: "not_in_play",
        sortOrder: 8,
        handoffNotes: "Moved through card distribution."
      })
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });

    await expect(
      getResponsibilityDetail({
        householdId: household.id,
        responsibilityId: responsibility.id
      })
    ).resolves.toMatchObject({
      id: responsibility.id,
      status: "active",
      boardLane: "player_2",
      boardSortOrder: 3,
      currentAssignments: expect.arrayContaining([
        {
          personaKey: "max",
          role: "accountable_owner",
          scope: "outcome"
        },
        {
          personaKey: "alex",
          role: "helper",
          scope: "support"
        }
      ])
    });
    await expect(
      prisma.responsibilityEvent.count({
        where: { responsibilityId: responsibility.id }
      })
    ).resolves.toBe(eventCountBeforeMove);
  });

  test("keeps collaborators when a quick move targets the existing owner", async () => {
    const { household, personas } = await createTestHousehold(
      "card-distribution-same-owner"
    );
    const [alex, max] = personas;
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "Same owner lane repair",
      summary: null,
      areaKeys: ["home_base"],
      hiddenEffortKeys: ["planning", "doing"],
      cadence: "weekly",
      status: "unassigned",
      visibility: "shared_household",
      householdStandard: null,
      notes: null,
      nextReviewAt: null,
      boardLane: "cards_of_concern",
      boardSortOrder: 3
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
        },
        {
          personaId: max.id,
          role: "helper",
          scope: "support"
        }
      ]
    });

    const assignmentEventCountBeforeMove = await prisma.responsibilityEvent.count({
      where: {
        responsibilityId: responsibility.id,
        eventType: "assignment_changed"
      }
    });
    const moved = await applyResponsibilityCardDistribution({
      householdId: household.id,
      responsibilityId: responsibility.id,
      actorPersonaId: alex.id,
      status: "active",
      targetOwnerPersonaKey: "alex",
      toLane: "player_1",
      sortOrder: 8,
      handoffNotes: "Moved through card distribution."
    });

    expect(moved).toMatchObject({
      id: responsibility.id,
      status: "active",
      boardLane: "player_1",
      boardSortOrder: 8,
      currentAssignments: expect.arrayContaining([
        {
          personaKey: "alex",
          role: "accountable_owner",
          scope: "outcome"
        },
        {
          personaKey: "max",
          role: "helper",
          scope: "support"
        }
      ])
    });
    expect(moved.currentAssignments).toHaveLength(2);
    await expect(
      prisma.responsibilityEvent.count({
        where: {
          responsibilityId: responsibility.id,
          eventType: "assignment_changed"
        }
      })
    ).resolves.toBe(assignmentEventCountBeforeMove);
  });

  test("atomically persists distribution status, handoff, assignment history, events, and placement", async () => {
    const { household, personas } = await createTestHousehold(
      "card-distribution-ownerless"
    );
    const [alex] = personas;
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "Ownerless quick Deal card",
      summary: null,
      areaKeys: ["home_base"],
      hiddenEffortKeys: ["planning"],
      cadence: "weekly",
      status: "unassigned",
      visibility: "shared_household",
      householdStandard: null,
      notes: null,
      nextReviewAt: null,
      boardLane: "cards_of_concern",
      boardSortOrder: 3
    });

    const moved = await applyResponsibilityCardDistribution({
      householdId: household.id,
      responsibilityId: responsibility.id,
      actorPersonaId: alex.id,
      status: "active",
      targetOwnerPersonaKey: "max",
      toLane: "player_2",
      sortOrder: 8,
      handoffNotes: "Moved through card distribution."
    });

    expect(moved).toMatchObject({
      id: responsibility.id,
      status: "active",
      boardLane: "player_2",
      boardSortOrder: 8,
      currentAssignments: [
        {
          personaKey: "max",
          role: "accountable_owner",
          scope: "outcome"
        }
      ]
    });

    await expect(
      prisma.responsibilityEvent.findMany({
        where: { responsibilityId: responsibility.id },
        select: { eventType: true, payload: true }
      })
    ).resolves.toEqual(
      expect.arrayContaining([
        {
          eventType: "status_changed",
          payload: {
            status: "active",
            note: null,
            reviewOn: null
          }
        },
        {
          eventType: "assignment_changed",
          payload: {
            assignments: [
              {
                personaKey: "max",
                role: "accountable_owner",
                scope: "outcome"
              }
            ],
            handoffNotes: null,
            revisitAt: null
          }
        },
        {
          eventType: "board_lane_changed",
          payload: {
            fromLane: "cards_of_concern",
            toLane: "player_2",
            fromSortOrder: 3,
            toSortOrder: 8,
            note: null
          }
        }
      ])
    );
    await expect(
      prisma.responsibilityEvent.count({
        where: { responsibilityId: responsibility.id }
      })
    ).resolves.toBe(3);
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
      handoffNotes: "Moved through card distribution."
    };

    const results = await Promise.allSettled([
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

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);

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

    const assignmentHistory = await prisma.responsibilityAssignment.findMany({
      where: {
        responsibilityId: responsibility.id
      },
      select: {
        startsAt: true,
        endsAt: true
      }
    });
    expect(
      assignmentHistory.every(
        (assignment) =>
          assignment.endsAt === null ||
          assignment.endsAt.getTime() >= assignment.startsAt.getTime()
      )
    ).toBe(true);
  });

  test("does not let a concurrent status move clear a newly assigned owner", async () => {
    const { household, personas } = await createTestHousehold(
      "card-distribution-concurrent-unlike"
    );
    const [alex, max] = personas;
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "Concurrent unlike move card",
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

    const results = await Promise.allSettled([
      applyResponsibilityCardDistribution({
        householdId: household.id,
        responsibilityId: responsibility.id,
        actorPersonaId: alex.id,
        status: "active",
        targetOwnerPersonaKey: "alex",
        toLane: "player_1",
        sortOrder: 1,
        handoffNotes: "Moved through card distribution."
      }),
      applyResponsibilityCardDistribution({
        householdId: household.id,
        responsibilityId: responsibility.id,
        actorPersonaId: max.id,
        status: "paused",
        targetOwnerPersonaKey: null,
        toLane: "not_in_play",
        sortOrder: 2,
        handoffNotes: "Moved through card distribution."
      })
    ]);

    expect(results[0]?.status).toBe("fulfilled");

    const detail = await getResponsibilityDetail({
      householdId: household.id,
      responsibilityId: responsibility.id
    });
    const finalTuple = {
      assignments: detail?.currentAssignments.map((assignment) => assignment.personaKey),
      lane: detail?.boardLane,
      sortOrder: detail?.boardSortOrder,
      status: detail?.status
    };

    expect(finalTuple).toEqual({
      assignments: ["alex"],
      lane: "player_1",
      sortOrder: 1,
      status: "active"
    });
  });

  test("rejects replacing a future-dated active assignment", async () => {
    const { household, personas } = await createTestHousehold(
      "card-distribution-future-assignment"
    );
    const [alex, max] = personas;
    const responsibility = await createResponsibility({
      householdId: household.id,
      createdByPersonaId: alex.id,
      title: "Future assignment card",
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
    const futureStart = new Date(Date.now() + 60_000).toISOString();
    await addResponsibilityAssignments({
      householdId: household.id,
      responsibilityId: responsibility.id,
      createdByPersonaId: alex.id,
      startsAt: futureStart,
      assignments: [
        {
          personaId: alex.id,
          role: "accountable_owner",
          scope: "outcome"
        }
      ]
    });

    await expect(
      applyResponsibilityCardDistribution({
        householdId: household.id,
        responsibilityId: responsibility.id,
        actorPersonaId: max.id,
        status: "active",
        targetOwnerPersonaKey: "max",
        toLane: "player_2",
        sortOrder: 0,
        handoffNotes: "Moved through card distribution."
      })
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });

    const history = await prisma.responsibilityAssignment.findMany({
      where: {
        responsibilityId: responsibility.id
      },
      orderBy: {
        createdAt: "asc"
      },
      select: {
        startsAt: true,
        endsAt: true
      }
    });
    expect(history).toHaveLength(1);
    expect(history[0]?.endsAt).toBeNull();
    await expect(
      getResponsibilityDetail({
        householdId: household.id,
        responsibilityId: responsibility.id
      })
    ).resolves.toMatchObject({
      boardLane: "cards_of_concern",
      currentAssignments: [
        {
          personaKey: "alex",
          role: "accountable_owner",
          scope: "outcome"
        }
      ]
    });
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
        handoffNotes: "Moved through card distribution."
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
