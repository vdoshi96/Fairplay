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
    title: responsibility.title,
    areaKeys: responsibility.areaKeys,
    hiddenEffortKeys: responsibility.hiddenEffortKeys,
    cadence: responsibility.cadence,
    relevantDays: responsibility.relevantDays,
    status: responsibility.status,
    visibility: responsibility.visibility,
    boardLane: responsibility.boardLane,
    boardSortOrder: responsibility.boardSortOrder,
    linkedRadarItems: [],
    currentAssignments: currentAssignments(responsibility.assignments),
    nextReviewAt: nullableIso(responsibility.nextReviewAt)
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
