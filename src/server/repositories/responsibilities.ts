import type {
  AssignmentRole,
  AssignmentScope,
  Cadence,
  HiddenEffortKey,
  Prisma,
  Responsibility,
  ResponsibilityAssignment,
  ResponsibilityBoardLane,
  ResponsibilityLifecycleNotes,
  ResponsibilityStatus,
  Visibility
} from "@prisma/client";

import type {
  ResponsibilityAssignmentSummary,
  ResponsibilityDetail,
  ResponsibilitySummary
} from "../../contracts/responsibilities";
import type { PersonaKey } from "../../domain/enums";
import type { HouseholdId, PersonaId, ResponsibilityId } from "../../domain/ids";
import { RepositoryError } from "../db/errors";
import { prisma } from "../db/prisma";

type ResponsibilityWithRelations = Responsibility & {
  assignments: (ResponsibilityAssignment & {
    persona: {
      key: "alex" | "max";
    };
  })[];
  lifecycleNotes: ResponsibilityLifecycleNotes | null;
};

export type CreateResponsibilityInput = {
  householdId: HouseholdId;
  createdByPersonaId: PersonaId;
  templateId?: string | null;
  title: string;
  summary?: string | null;
  areaKeys: string[];
  hiddenEffortKeys: HiddenEffortKey[];
  cadence: Cadence;
  relevantDays?: string[] | null;
  status?: ResponsibilityStatus;
  visibility: Visibility;
  householdStandard?: string | null;
  notes?: string | null;
  nextReviewAt?: string | null;
  boardLane?: ResponsibilityBoardLane;
  boardSortOrder?: number;
  sourceDefinition?: string | null;
  sourceConception?: string | null;
  sourcePlanning?: string | null;
  sourceExecution?: string | null;
  sourceMinimumStandard?: string | null;
  sourceCoverAssetPath?: string | null;
};

function nullableIso(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

function currentAssignments(
  assignments: ResponsibilityWithRelations["assignments"]
): ResponsibilityAssignmentSummary[] {
  return assignments
    .filter((assignment) => assignment.endsAt === null)
    .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
    .map((assignment) => ({
      personaKey: assignment.persona.key,
      role: assignment.role,
      scope: assignment.scope
    }));
}

function toLifecycleNotes(
  notes: ResponsibilityLifecycleNotes | null
): ResponsibilityDetail["lifecycleNotes"] {
  if (!notes) {
    return null;
  }

  return {
    noticeDecideNotes: notes.noticeDecideNotes,
    planPrepareNotes: notes.planPrepareNotes,
    executeFollowThroughNotes: notes.executeFollowThroughNotes,
    dependencies: notes.dependencies,
    blockers: notes.blockers,
    supportNeeded: notes.supportNeeded,
    handoffNotes: notes.handoffNotes,
    updatedAt: notes.updatedAt.toISOString()
  };
}

function toResponsibilitySummary(
  responsibility: ResponsibilityWithRelations
): ResponsibilitySummary {
  return {
    id: responsibility.id,
    templateId: responsibility.templateId,
    title: responsibility.title,
    summary: responsibility.summary,
    areaKeys: responsibility.areaKeys,
    hiddenEffortKeys: responsibility.hiddenEffortKeys,
    cadence: responsibility.cadence,
    relevantDays: responsibility.relevantDays,
    status: responsibility.status,
    visibility: responsibility.visibility,
    boardLane: responsibility.boardLane,
    boardSortOrder: responsibility.boardSortOrder,
    currentAssignments: currentAssignments(responsibility.assignments),
    nextReviewAt: nullableIso(responsibility.nextReviewAt),
    householdStandard: responsibility.householdStandard,
    sourceDefinition: responsibility.sourceDefinition,
    sourceMinimumStandard: responsibility.sourceMinimumStandard,
    sourceCoverAssetPath: responsibility.sourceCoverAssetPath
  };
}

function toResponsibilityDetail(
  responsibility: ResponsibilityWithRelations
): ResponsibilityDetail {
  return {
    ...toResponsibilitySummary(responsibility),
    summary: responsibility.summary,
    householdStandard: responsibility.householdStandard,
    notes: responsibility.notes,
    lifecycleNotes: toLifecycleNotes(responsibility.lifecycleNotes),
    lastReviewedAt: nullableIso(responsibility.lastReviewedAt),
    sourceDefinition: responsibility.sourceDefinition,
    sourceConception: responsibility.sourceConception,
    sourcePlanning: responsibility.sourcePlanning,
    sourceExecution: responsibility.sourceExecution,
    sourceMinimumStandard: responsibility.sourceMinimumStandard,
    sourceCoverAssetPath: responsibility.sourceCoverAssetPath,
    createdAt: responsibility.createdAt.toISOString(),
    updatedAt: responsibility.updatedAt.toISOString(),
    archivedAt: nullableIso(responsibility.archivedAt)
  };
}

const responsibilityInclude = {
  assignments: {
    include: {
      persona: {
        select: {
          key: true
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  },
  lifecycleNotes: true
} satisfies Prisma.ResponsibilityInclude;

type ResponsibilityWriteClient = Pick<
  Prisma.TransactionClient,
  "persona" | "responsibilityTemplate" | "responsibility"
>;

export async function createResponsibilityWithClient(
  client: ResponsibilityWriteClient,
  input: CreateResponsibilityInput
): Promise<ResponsibilityDetail> {
  const [creatorCount, templateCount] = await Promise.all([
    client.persona.count({
      where: {
        id: input.createdByPersonaId,
        householdId: input.householdId
      }
    }),
    input.templateId
      ? client.responsibilityTemplate.count({
          where: {
            id: input.templateId
          }
        })
      : Promise.resolve(1)
  ]);

  if (creatorCount !== 1) {
    throw new RepositoryError("INVALID_INPUT", "Creator persona does not belong to household.");
  }

  if (templateCount !== 1) {
    throw new RepositoryError("INVALID_INPUT", "Responsibility template does not exist.");
  }

  const responsibility = await client.responsibility.create({
    data: {
      householdId: input.householdId,
      createdByPersonaId: input.createdByPersonaId,
      templateId: input.templateId ?? null,
      title: input.title,
      summary: input.summary ?? null,
      areaKeys: input.areaKeys,
      hiddenEffortKeys: input.hiddenEffortKeys,
      cadence: input.cadence,
      relevantDays: input.relevantDays ?? [],
      status: input.status ?? "unassigned",
      visibility: input.visibility,
      boardLane: input.boardLane ?? "cards_of_concern",
      boardSortOrder: input.boardSortOrder ?? 0,
      householdStandard: input.householdStandard ?? null,
      notes: input.notes ?? null,
      sourceDefinition: input.sourceDefinition ?? null,
      sourceConception: input.sourceConception ?? null,
      sourcePlanning: input.sourcePlanning ?? null,
      sourceExecution: input.sourceExecution ?? null,
      sourceMinimumStandard: input.sourceMinimumStandard ?? null,
      sourceCoverAssetPath: input.sourceCoverAssetPath ?? null,
      nextReviewAt: input.nextReviewAt ? new Date(input.nextReviewAt) : null
    },
    include: responsibilityInclude
  });

  return toResponsibilityDetail(responsibility as ResponsibilityWithRelations);
}

export async function createResponsibility(
  input: CreateResponsibilityInput
): Promise<ResponsibilityDetail> {
  return createResponsibilityWithClient(prisma, input);
}

export async function addResponsibilityAssignments(input: {
  householdId: HouseholdId;
  responsibilityId: ResponsibilityId;
  createdByPersonaId: PersonaId;
  startsAt: string | Date;
  assignments: {
    personaId: PersonaId;
    role: AssignmentRole;
    scope: AssignmentScope;
  }[];
}): Promise<ResponsibilityDetail> {
  const startsAt = new Date(input.startsAt);
  const responsibility = await prisma.$transaction(async (tx) => {
    const responsibility = await tx.responsibility.findFirst({
      where: {
        id: input.responsibilityId,
        householdId: input.householdId
      },
      select: {
        id: true
      }
    });
    if (!responsibility) {
      throw new RepositoryError("NOT_FOUND", "Responsibility not found for household.");
    }

    const personaIds = [
      ...new Set([
        input.createdByPersonaId,
        ...input.assignments.map((assignment) => assignment.personaId)
      ])
    ];
    const householdPersonaCount = await tx.persona.count({
      where: {
        householdId: input.householdId,
        id: {
          in: personaIds
        }
      }
    });
    if (householdPersonaCount !== personaIds.length) {
      throw new RepositoryError(
        "INVALID_INPUT",
        "Assignment personas must belong to the responsibility household."
      );
    }

    await tx.responsibilityAssignment.updateMany({
      where: {
        responsibilityId: input.responsibilityId,
        responsibility: {
          householdId: input.householdId
        },
        endsAt: null
      },
      data: {
        endsAt: startsAt
      }
    });
    await tx.responsibilityAssignment.createMany({
      data: input.assignments.map((assignment) => ({
        responsibilityId: input.responsibilityId,
        personaId: assignment.personaId,
        role: assignment.role,
        scope: assignment.scope,
        startsAt,
        createdByPersonaId: input.createdByPersonaId
      }))
    });

    return tx.responsibility.findFirstOrThrow({
      where: {
        id: input.responsibilityId,
        householdId: input.householdId
      },
      include: responsibilityInclude
    });
  });

  return toResponsibilityDetail(responsibility as ResponsibilityWithRelations);
}

export async function getResponsibilityDetail(input: {
  householdId: HouseholdId;
  responsibilityId: ResponsibilityId;
}): Promise<ResponsibilityDetail | null> {
  const responsibility = await prisma.responsibility.findFirst({
    where: {
      id: input.responsibilityId,
      householdId: input.householdId
    },
    include: responsibilityInclude
  });

  return responsibility
    ? toResponsibilityDetail(responsibility as ResponsibilityWithRelations)
    : null;
}

export type ApplyResponsibilityCardDistributionInput = {
  householdId: HouseholdId;
  responsibilityId: ResponsibilityId;
  actorPersonaId: PersonaId;
  status: Extract<
    ResponsibilityStatus,
    "active" | "not_relevant" | "paused" | "unassigned"
  >;
  targetOwnerPersonaKey: PersonaKey | null;
  toLane: ResponsibilityBoardLane;
  sortOrder: number;
  effectiveAt: string | Date;
  handoffNotes?: string;
  revisitAt?: string;
};

/**
 * Applies every persisted part of a Deal/Board move in one transaction.
 *
 * Status, assignment history, audit events, and board placement must not be
 * split across service calls: a later failure would otherwise leave the card
 * in a mixed state that no product bucket can represent reliably.
 */
export async function applyResponsibilityCardDistribution(
  input: ApplyResponsibilityCardDistributionInput
): Promise<ResponsibilityDetail> {
  const responsibility = await prisma.$transaction((tx) =>
    applyResponsibilityCardDistributionWithClient(tx, input)
  );

  return toResponsibilityDetail(responsibility as ResponsibilityWithRelations);
}

async function applyResponsibilityCardDistributionWithClient(
  tx: Prisma.TransactionClient,
  input: ApplyResponsibilityCardDistributionInput
) {
  // Serialize moves for one card so concurrent devices cannot leave multiple
  // active owners or event payloads derived from the same stale lane.
  const lockedResponsibilities = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "Responsibility"
    WHERE "id" = ${input.responsibilityId}
      AND "householdId" = ${input.householdId}
    FOR UPDATE
  `;

  if (lockedResponsibilities.length === 0) {
    throw new RepositoryError("NOT_FOUND", "Responsibility not found for household.");
  }

  const [existing, actorPersona, targetOwnerPersona] = await Promise.all([
    tx.responsibility.findFirst({
      where: {
        id: input.responsibilityId,
        householdId: input.householdId
      },
      select: {
        id: true,
        status: true,
        boardLane: true,
        boardSortOrder: true,
        assignments: {
          where: {
            endsAt: null
          },
          select: {
            role: true,
            persona: {
              select: {
                key: true
              }
            }
          }
        }
      }
    }),
    tx.persona.findFirst({
      where: {
        id: input.actorPersonaId,
        householdId: input.householdId
      },
      select: {
        id: true
      }
    }),
    input.targetOwnerPersonaKey
      ? tx.persona.findFirst({
          where: {
            householdId: input.householdId,
            key: input.targetOwnerPersonaKey
          },
          select: {
            id: true
          }
        })
      : Promise.resolve(null)
  ]);

  if (!existing) {
    throw new RepositoryError(
      "NOT_FOUND",
      "Responsibility disappeared during distribution."
    );
  }

  if (!actorPersona) {
    throw new RepositoryError(
      "INVALID_INPUT",
      "Actor persona does not belong to the responsibility household."
    );
  }

  if (input.targetOwnerPersonaKey && !targetOwnerPersona) {
    throw new RepositoryError(
      "INVALID_INPUT",
      "Target owner persona does not belong to the responsibility household."
    );
  }

  const effectiveAt = new Date(input.effectiveAt);
  if (Number.isNaN(effectiveAt.getTime())) {
    throw new RepositoryError("INVALID_INPUT", "Effective date must be valid.");
  }

  const currentOwnerKeys = existing.assignments
    .filter(
      (assignment) =>
        assignment.role === "accountable_owner" ||
        assignment.role === "shared_owner"
    )
    .map((assignment) => assignment.persona.key)
    .sort();
  const assignmentChanged = input.targetOwnerPersonaKey
    ? currentOwnerKeys.length !== 1 ||
      currentOwnerKeys[0] !== input.targetOwnerPersonaKey
    : currentOwnerKeys.length !== 0;
  const hasCurrentOwner = currentOwnerKeys.length > 0;

  if (
    assignmentChanged &&
    hasCurrentOwner &&
    (!input.handoffNotes || !input.revisitAt)
  ) {
    throw new RepositoryError(
      "INVALID_INPUT",
      "Accountable owner changes need handoff context and a revisit date."
    );
  }

  if (existing.status !== input.status) {
    await tx.responsibility.update({
      where: {
        id: input.responsibilityId
      },
      data: {
        status: input.status
      }
    });
    await tx.responsibilityEvent.create({
      data: {
        householdId: input.householdId,
        responsibilityId: input.responsibilityId,
        actorPersonaId: input.actorPersonaId,
        eventType: "status_changed",
        payload: {
          status: input.status,
          note: null,
          reviewOn: null
        },
        occurredAt: new Date()
      }
    });
  }

  if (assignmentChanged) {
    await tx.responsibilityAssignment.updateMany({
      where: {
        responsibilityId: input.responsibilityId,
        responsibility: {
          householdId: input.householdId
        },
        endsAt: null
      },
      data: {
        endsAt: effectiveAt
      }
    });

    if (input.targetOwnerPersonaKey && targetOwnerPersona) {
      await tx.responsibilityAssignment.create({
        data: {
          responsibilityId: input.responsibilityId,
          personaId: targetOwnerPersona.id,
          role: "accountable_owner",
          scope: "outcome",
          startsAt: effectiveAt,
          createdByPersonaId: input.actorPersonaId
        }
      });
    }

    await tx.responsibilityEvent.create({
      data: {
        householdId: input.householdId,
        responsibilityId: input.responsibilityId,
        actorPersonaId: input.actorPersonaId,
        eventType: "assignment_changed",
        payload: {
          assignments: input.targetOwnerPersonaKey
            ? [
                {
                  personaKey: input.targetOwnerPersonaKey,
                  role: "accountable_owner",
                  scope: "outcome"
                }
              ]
            : [],
          handoffNotes: hasCurrentOwner ? input.handoffNotes ?? null : null,
          revisitAt: hasCurrentOwner ? input.revisitAt ?? null : null
        },
        occurredAt: effectiveAt
      }
    });
  }

  await tx.responsibilityEvent.create({
    data: {
      householdId: input.householdId,
      responsibilityId: input.responsibilityId,
      actorPersonaId: input.actorPersonaId,
      eventType: "board_lane_changed",
      payload: {
        fromLane: existing.boardLane,
        toLane: input.toLane,
        fromSortOrder: existing.boardSortOrder,
        toSortOrder: input.sortOrder,
        note: null
      },
      occurredAt: new Date()
    }
  });

  return tx.responsibility.update({
    where: {
      id: input.responsibilityId
    },
    data: {
      boardLane: input.toLane,
      boardSortOrder: input.sortOrder
    },
    include: responsibilityInclude
  });
}

export async function updateResponsibilityBoardPlacement(input: {
  householdId: HouseholdId;
  responsibilityId: ResponsibilityId;
  toLane: ResponsibilityBoardLane;
  sortOrder: number;
  actorPersonaId?: PersonaId;
  note?: string;
}): Promise<ResponsibilityDetail> {
  const responsibility = await prisma.$transaction(async (tx) => {
    const existing = await tx.responsibility.findFirst({
      where: {
        id: input.responsibilityId,
        householdId: input.householdId
      },
      select: {
        id: true,
        boardLane: true,
        boardSortOrder: true
      }
    });

    if (!existing) {
      throw new RepositoryError("NOT_FOUND", "Responsibility not found for household.");
    }

    await tx.responsibilityEvent.create({
      data: {
        householdId: input.householdId,
        responsibilityId: input.responsibilityId,
        actorPersonaId: input.actorPersonaId ?? null,
        eventType: "board_lane_changed",
        payload: {
          fromLane: existing.boardLane,
          toLane: input.toLane,
          fromSortOrder: existing.boardSortOrder,
          toSortOrder: input.sortOrder,
          note: input.note ?? null
        },
        occurredAt: new Date()
      }
    });

    return tx.responsibility.update({
      where: {
        id: input.responsibilityId
      },
      data: {
        boardLane: input.toLane,
        boardSortOrder: input.sortOrder
      },
      include: responsibilityInclude
    });
  });

  return toResponsibilityDetail(responsibility as ResponsibilityWithRelations);
}

export async function listResponsibilitiesForHousehold(
  householdId: HouseholdId
): Promise<ResponsibilitySummary[]> {
  const responsibilities = await prisma.responsibility.findMany({
    where: {
      archivedAt: null,
      householdId
    },
    include: responsibilityInclude,
    orderBy: {
      createdAt: "asc"
    }
  });

  return responsibilities.map((responsibility) =>
    toResponsibilitySummary(responsibility as ResponsibilityWithRelations)
  );
}
