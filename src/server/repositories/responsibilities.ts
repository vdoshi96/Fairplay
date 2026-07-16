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
import type {
  OwnershipAgreementAssignment,
  OwnershipHandoffMode
} from "../../contracts/ownership-agreement";
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
    sourceConception: responsibility.sourceConception,
    sourcePlanning: responsibility.sourcePlanning,
    sourceExecution: responsibility.sourceExecution,
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

async function lockResponsibilityForUpdate(
  tx: Prisma.TransactionClient,
  input: {
    householdId: HouseholdId;
    responsibilityId: ResponsibilityId;
  }
) {
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
}

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
  expectedOwnerPersonaKeys?: PersonaKey[];
  assignments: {
    personaId: PersonaId;
    role: AssignmentRole;
    scope: AssignmentScope;
  }[];
}): Promise<ResponsibilityDetail> {
  const startsAt = new Date(input.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    throw new RepositoryError("INVALID_INPUT", "Assignment effective date must be valid.");
  }

  const responsibility = await prisma.$transaction(async (tx) => {
    await lockResponsibilityForUpdate(tx, input);

    const responsibility = await tx.responsibility.findFirst({
      where: {
        id: input.responsibilityId,
        householdId: input.householdId
      },
      select: {
        id: true,
        assignments: {
          where: {
            endsAt: null
          },
          select: {
            startsAt: true,
            role: true,
            persona: {
              select: {
                key: true
              }
            }
          }
        }
      }
    });
    if (!responsibility) {
      throw new RepositoryError("NOT_FOUND", "Responsibility not found for household.");
    }

    const latestActiveStart = responsibility.assignments.reduce(
      (latest, assignment) => Math.max(latest, assignment.startsAt.getTime()),
      Number.NEGATIVE_INFINITY
    );
    if (startsAt.getTime() < latestActiveStart) {
      throw new RepositoryError(
        "INVALID_INPUT",
        "Assignment effective date cannot predate the current assignment."
      );
    }

    if (input.expectedOwnerPersonaKeys) {
      const currentOwnerPersonaKeys = [
        ...new Set(
          responsibility.assignments
            .filter((assignment) => isOwnerRole(assignment.role))
            .map((assignment) => assignment.persona.key)
        )
      ];
      if (
        currentOwnerPersonaKeys.sort().join("|") !==
        [...input.expectedOwnerPersonaKeys].sort().join("|")
      ) {
        throw new RepositoryError(
          "CONFLICT",
          "Ownership agreement changed before the legacy assignment write."
        );
      }
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
  handoffNotes?: string;
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

export type ApplyResponsibilityOwnershipAgreementInput = {
  householdId: HouseholdId;
  responsibilityId: ResponsibilityId;
  actorPersonaId: PersonaId;
  expectedUpdatedAt: string;
  expectedOwnerPersonaKeys: PersonaKey[];
  assignments: OwnershipAgreementAssignment[];
  reviewAt: string | null;
  handoffMode?: OwnershipHandoffMode | null;
  handoffNotes?: string | null;
};

function isOwnerRole(role: AssignmentRole) {
  return role === "accountable_owner" || role === "shared_owner";
}

function assignmentSignature(
  assignments: readonly OwnershipAgreementAssignment[]
) {
  return assignments
    .map(
      (assignment) =>
        `${assignment.personaKey}:${assignment.role}:${assignment.scope}`
    )
    .sort()
    .join("|");
}

/**
 * Replaces a card's complete ownership agreement and review date atomically.
 *
 * The responsibility row is locked before current ownership is inspected so a
 * stale client cannot silently remove an owner that another request just added.
 * Board lane values are intentionally left unchanged; shared presentation is
 * derived from assignments rather than a new persisted lane.
 */
export async function applyResponsibilityOwnershipAgreement(
  input: ApplyResponsibilityOwnershipAgreementInput
): Promise<ResponsibilityDetail> {
  const expectedUpdatedAt = new Date(input.expectedUpdatedAt);
  if (Number.isNaN(expectedUpdatedAt.getTime())) {
    throw new RepositoryError(
      "INVALID_INPUT",
      "Expected responsibility revision must be valid."
    );
  }

  const reviewAt = input.reviewAt === null ? null : new Date(input.reviewAt);
  if (reviewAt && Number.isNaN(reviewAt.getTime())) {
    throw new RepositoryError(
      "INVALID_INPUT",
      "Ownership review date must be valid."
    );
  }

  const responsibility = await prisma.$transaction(async (tx) => {
    await lockResponsibilityForUpdate(tx, input);

    const [existing, actorPersona, agreementPersonas] = await Promise.all([
      tx.responsibility.findFirst({
        where: {
          id: input.responsibilityId,
          householdId: input.householdId
        },
        select: {
          id: true,
          updatedAt: true,
          boardLane: true,
          boardSortOrder: true,
          assignments: {
            where: {
              endsAt: null
            },
            select: {
              role: true,
              scope: true,
              startsAt: true,
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
      tx.persona.findMany({
        where: {
          householdId: input.householdId,
          key: {
            in: input.assignments.map((assignment) => assignment.personaKey)
          }
        },
        select: {
          id: true,
          key: true
        }
      })
    ]);

    if (!existing) {
      throw new RepositoryError(
        "NOT_FOUND",
        "Responsibility disappeared during ownership update."
      );
    }

    if (existing.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
      throw new RepositoryError(
        "CONFLICT",
        "Responsibility changed since the ownership agreement was opened."
      );
    }

    if (!actorPersona) {
      throw new RepositoryError(
        "INVALID_INPUT",
        "Actor persona does not belong to the responsibility household."
      );
    }

    const requestedPersonaKeys = input.assignments.map(
      (assignment) => assignment.personaKey
    );
    if (
      new Set(requestedPersonaKeys).size !== requestedPersonaKeys.length ||
      agreementPersonas.length !== requestedPersonaKeys.length
    ) {
      throw new RepositoryError(
        "INVALID_INPUT",
        "Ownership agreement personas must be unique members of the household."
      );
    }

    const requestedOwnerKeys = new Set(
      input.assignments
        .filter((assignment) => isOwnerRole(assignment.role))
        .map((assignment) => assignment.personaKey)
    );
    if (requestedOwnerKeys.size === 0) {
      throw new RepositoryError(
        "INVALID_INPUT",
        "An ownership agreement needs at least one owner."
      );
    }
    if (
      new Set(input.expectedOwnerPersonaKeys).size !==
      input.expectedOwnerPersonaKeys.length
    ) {
      throw new RepositoryError(
        "INVALID_INPUT",
        "Expected owner personas must be unique."
      );
    }
    if (
      input.assignments.filter(
        (assignment) => assignment.role === "accountable_owner"
      ).length > 1
    ) {
      throw new RepositoryError(
        "INVALID_INPUT",
        "Use shared-owner roles when more than one persona owns the work."
      );
    }
    if (
      input.assignments.some(
        (assignment) => assignment.role === "shared_owner"
      ) &&
      requestedOwnerKeys.size < 2
    ) {
      throw new RepositoryError(
        "INVALID_INPUT",
        "A shared owner needs another owner in the agreement."
      );
    }

    const previousOwnerKeys = [
      ...new Set(
        existing.assignments
          .filter((assignment) => isOwnerRole(assignment.role))
          .map((assignment) => assignment.persona.key)
      )
    ];
    const removedOwnerKeys = previousOwnerKeys.filter(
      (personaKey) => !requestedOwnerKeys.has(personaKey)
    );

    if (
      [...previousOwnerKeys].sort().join("|") !==
      [...input.expectedOwnerPersonaKeys].sort().join("|")
    ) {
      throw new RepositoryError(
        "CONFLICT",
        "Ownership agreement changed since it was opened."
      );
    }

    if (removedOwnerKeys.length > 0 && !input.handoffMode) {
      throw new RepositoryError(
        "INVALID_INPUT",
        "Choose whether to replace each former owner or retain them as a helper."
      );
    }

    if (
      removedOwnerKeys.length > 0 &&
      input.handoffMode === "replace_former_owner" &&
      removedOwnerKeys.some((personaKey) =>
        input.assignments.some(
          (assignment) => assignment.personaKey === personaKey
        )
      )
    ) {
      throw new RepositoryError(
        "INVALID_INPUT",
        "Replace-owner handoff cannot also keep the former owner in the agreement."
      );
    }

    const finalAssignments = input.assignments.map((assignment) => ({
      ...assignment
    }));
    if (
      removedOwnerKeys.length > 0 &&
      input.handoffMode === "retain_former_owner_as_helper"
    ) {
      removedOwnerKeys.forEach((personaKey) => {
        const existingIndex = finalAssignments.findIndex(
          (assignment) => assignment.personaKey === personaKey
        );
        const helperAssignment: OwnershipAgreementAssignment = {
          personaKey,
          role: "helper",
          scope: "support"
        };

        if (existingIndex >= 0) {
          finalAssignments[existingIndex] = helperAssignment;
        } else {
          finalAssignments.push(helperAssignment);
        }
      });
    }

    const personaIdByKey = new Map(
      agreementPersonas.map((persona) => [persona.key, persona.id])
    );
    const missingRetainedPersonaKeys = finalAssignments
      .map((assignment) => assignment.personaKey)
      .filter((personaKey) => !personaIdByKey.has(personaKey));
    if (missingRetainedPersonaKeys.length > 0) {
      const retainedPersonas = await tx.persona.findMany({
        where: {
          householdId: input.householdId,
          key: {
            in: missingRetainedPersonaKeys
          }
        },
        select: {
          id: true,
          key: true
        }
      });
      retainedPersonas.forEach((persona) => {
        personaIdByKey.set(persona.key, persona.id);
      });
    }
    if (
      personaIdByKey.size <
      new Set(finalAssignments.map((item) => item.personaKey)).size
    ) {
      throw new RepositoryError(
        "INVALID_INPUT",
        "A retained former owner is not available in this household."
      );
    }

    const currentAssignments: OwnershipAgreementAssignment[] =
      existing.assignments.map((assignment) => ({
        personaKey: assignment.persona.key,
        role: assignment.role,
        scope: assignment.scope
      }));
    const assignmentsChanged =
      assignmentSignature(currentAssignments) !==
      assignmentSignature(finalAssignments);
    const finalOwnerKeys = [
      ...new Set(
        finalAssignments
          .filter((assignment) => isOwnerRole(assignment.role))
          .map((assignment) => assignment.personaKey)
      )
    ];
    const nextBoardLane: ResponsibilityBoardLane =
      finalOwnerKeys.length === 1
        ? finalOwnerKeys[0] === "alex"
          ? "player_1"
          : "player_2"
        : existing.boardLane;
    const boardLaneChanged = nextBoardLane !== existing.boardLane;

    const latestActiveStart = existing.assignments.reduce(
      (latest, assignment) => Math.max(latest, assignment.startsAt.getTime()),
      Number.NEGATIVE_INFINITY
    );
    const effectiveAt = new Date(
      Math.max(Date.now(), latestActiveStart, existing.updatedAt.getTime() + 1)
    );

    if (assignmentsChanged) {
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

      await tx.responsibilityAssignment.createMany({
        data: finalAssignments.map((assignment) => ({
          responsibilityId: input.responsibilityId,
          personaId: personaIdByKey.get(assignment.personaKey)!,
          role: assignment.role,
          scope: assignment.scope,
          startsAt: effectiveAt,
          createdByPersonaId: input.actorPersonaId
        }))
      });
    }

    await tx.responsibilityEvent.create({
      data: {
        householdId: input.householdId,
        responsibilityId: input.responsibilityId,
        actorPersonaId: input.actorPersonaId,
        eventType: "assignment_changed",
        payload: {
          assignments: finalAssignments,
          handoffNotes: input.handoffNotes ?? null,
          revisitAt: input.reviewAt,
          reviewAt: input.reviewAt,
          handoffMode:
            removedOwnerKeys.length > 0 ? input.handoffMode ?? null : null,
          formerOwnerPersonaKeys: removedOwnerKeys
        },
        occurredAt: effectiveAt
      }
    });

    if (boardLaneChanged) {
      await tx.responsibilityEvent.create({
        data: {
          householdId: input.householdId,
          responsibilityId: input.responsibilityId,
          actorPersonaId: input.actorPersonaId,
          eventType: "board_lane_changed",
          payload: {
            fromLane: existing.boardLane,
            toLane: nextBoardLane,
            fromSortOrder: existing.boardSortOrder,
            toSortOrder: existing.boardSortOrder,
            note: null
          },
          occurredAt: effectiveAt
        }
      });
    }

    return tx.responsibility.update({
      where: {
        id: input.responsibilityId
      },
      data: {
        nextReviewAt: reviewAt,
        boardLane: nextBoardLane,
        updatedAt: effectiveAt
      },
      include: responsibilityInclude
    });
  });

  return toResponsibilityDetail(responsibility as ResponsibilityWithRelations);
}

async function applyResponsibilityCardDistributionWithClient(
  tx: Prisma.TransactionClient,
  input: ApplyResponsibilityCardDistributionInput
) {
  // Serialize moves for one card so concurrent devices cannot leave multiple
  // active owners or event payloads derived from the same stale lane.
  await lockResponsibilityForUpdate(tx, input);

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
            startsAt: true,
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

  // Capture mutation time only after the row lock is acquired. Caller-captured
  // timestamps can be committed in the opposite order under concurrency and
  // produce assignment histories whose endsAt predates startsAt.
  const latestActiveStart = existing.assignments.reduce(
    (latest, assignment) => Math.max(latest, assignment.startsAt.getTime()),
    Number.NEGATIVE_INFINITY
  );
  const effectiveAt = new Date(Math.max(Date.now(), latestActiveStart));
  const revisitAt = new Date(effectiveAt);
  revisitAt.setDate(revisitAt.getDate() + 7);
  const revisitAtIso = revisitAt.toISOString();

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
    !input.handoffNotes
  ) {
    throw new RepositoryError(
      "INVALID_INPUT",
      "Accountable owner changes need handoff context."
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
        occurredAt: effectiveAt
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
          revisitAt: hasCurrentOwner ? revisitAtIso : null
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
      occurredAt: effectiveAt
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
    await lockResponsibilityForUpdate(tx, input);

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
