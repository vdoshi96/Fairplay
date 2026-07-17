import type { Prisma } from "@prisma/client";

import type { PersonaSummary } from "@/contracts/personas";
import {
  OwnershipAgreementMutationSchema,
  type OwnershipAgreementMutation
} from "@/contracts/ownership-agreement";
import type {
  LoadSnapshotSummary,
  ResponsibilityAssignmentSummary,
  ResponsibilityCreate,
  ResponsibilityDetail,
  ResponsibilitySummary,
  ResponsibilityUpdate,
  ResponsibilityVisibilityMutation
} from "@/contracts/responsibilities";
import type {
  ResponsibilityStatus,
  Visibility
} from "@/domain/enums";
import type { HouseholdId, PersonaId, ResponsibilityId } from "@/domain/ids";
import { assertVisibilityTransition } from "@/domain/visibility";
import type { CurrentSession } from "@/server/auth/current-session";
import { prisma } from "@/server/db/prisma";
import { ensureHouseholdCatalogResponsibilities } from "@/server/repositories/card-templates";
import {
  applyResponsibilityAssignmentRevision,
  applyResponsibilityOwnershipAgreement,
  type ApplyResponsibilityOwnershipAgreementInput,
  createResponsibility,
  getResponsibilityDetail,
  listResponsibilitiesForHousehold
} from "@/server/repositories/responsibilities";
import { listPersonasForHousehold } from "@/server/repositories/personas";
import { buildLoadSnapshot } from "./load-snapshot";

export type ResponsibilityServiceErrorCode =
  | "AUTH_REQUIRED"
  | "INVALID_INPUT"
  | "NOT_FOUND";

export class ResponsibilityServiceError extends Error {
  readonly code: ResponsibilityServiceErrorCode;

  constructor(code: ResponsibilityServiceErrorCode, message: string) {
    super(message);
    this.name = "ResponsibilityServiceError";
    this.code = code;
  }
}

export type AssignmentReplacement = ResponsibilityAssignmentSummary & {
  personaId: PersonaId;
};

export type CreateResponsibilityRecordInput = ResponsibilityCreate & {
  householdId: HouseholdId;
  createdByPersonaId: PersonaId;
  status: ResponsibilityStatus;
  visibility: Exclude<Visibility, "private">;
};

export type UpdateResponsibilityRecordInput = Partial<
  Omit<ResponsibilityCreate, "currentAssignments" | "visibility">
> & {
  householdId: HouseholdId;
  responsibilityId: ResponsibilityId;
  archivedAt?: string;
  status?: ResponsibilityStatus;
  visibility?: Exclude<Visibility, "private">;
};

export type ReplaceActiveAssignmentsInput = {
  householdId: HouseholdId;
  responsibilityId: ResponsibilityId;
  createdByPersonaId: PersonaId;
  effectiveAt: string;
  expectedUpdatedAt: string;
  expectedOwnerPersonaKeys: ("alex" | "max")[];
  assignments: AssignmentReplacement[];
  handoffNotes?: string | null;
  revisitAt?: string | null;
};

export type ResponsibilityEventInput = {
  householdId: HouseholdId;
  responsibilityId: ResponsibilityId;
  actorPersonaId: PersonaId;
  eventType: string;
  payload: Prisma.InputJsonValue;
  occurredAt: string;
};

export type ResponsibilityServiceDeps = {
  listPersonasForHousehold: (
    householdId: HouseholdId
  ) => Promise<readonly PersonaSummary[]>;
  createResponsibilityRecord: (
    input: CreateResponsibilityRecordInput
  ) => Promise<ResponsibilityDetail>;
  updateResponsibilityRecord: (
    input: UpdateResponsibilityRecordInput
  ) => Promise<ResponsibilityDetail>;
  getResponsibility: (input: {
    householdId: HouseholdId;
    responsibilityId: ResponsibilityId;
  }) => Promise<ResponsibilityDetail | null>;
  listResponsibilities: (
    householdId: HouseholdId
  ) => Promise<ResponsibilitySummary[]>;
  replaceActiveAssignments: (
    input: ReplaceActiveAssignmentsInput
  ) => Promise<ResponsibilityDetail>;
  applyOwnershipAgreement: (
    input: ApplyResponsibilityOwnershipAgreementInput
  ) => Promise<ResponsibilityDetail>;
  createResponsibilityEvent: (
    input: ResponsibilityEventInput
  ) => Promise<void>;
  ensureCatalogResponsibilities?: (input: {
    actorPersonaId: PersonaId;
    householdId: HouseholdId;
  }) => Promise<void>;
};

export type AssignmentMutationInput = {
  effectiveAt: string;
  assignments: ResponsibilityAssignmentSummary[];
  handoffNotes?: string;
  revisitAt?: string;
};

export type StatusMutationInput = {
  status: Extract<
    ResponsibilityStatus,
    "active" | "needs_review" | "paused" | "not_relevant" | "archived" | "unassigned"
  >;
  confirmedArchive?: boolean;
  note?: string;
  reviewOn?: string | null;
};

function requireSelectedPersona(session: CurrentSession): PersonaId {
  if (!session.selectedPersonaId) {
    throw new ResponsibilityServiceError(
      "AUTH_REQUIRED",
      "A selected persona is required."
    );
  }

  return session.selectedPersonaId;
}

function assertSharedResponsibilityVisibility(visibility: Visibility) {
  if (visibility === "private") {
    throw new ResponsibilityServiceError(
      "INVALID_INPUT",
      "Private responsibility visibility is not available in v1."
    );
  }
}

function currentOwnerPersonaKeys(
  assignments: readonly ResponsibilityAssignmentSummary[]
) {
  return assignments
    .filter(
      (assignment) =>
        assignment.role === "accountable_owner" ||
        assignment.role === "shared_owner"
    )
    .map((assignment) => assignment.personaKey)
    .sort();
}

function ownerAgreementSignature(
  assignments: readonly ResponsibilityAssignmentSummary[]
) {
  return assignments
    .filter(
      (assignment) =>
        assignment.role === "accountable_owner" ||
        assignment.role === "shared_owner"
    )
    .map(
      (assignment) =>
        `${assignment.personaKey}:${assignment.role}:${assignment.scope}`
    )
    .sort()
    .join("|");
}

function ownerAgreementChanged(
  previous: readonly ResponsibilityAssignmentSummary[],
  next: readonly ResponsibilityAssignmentSummary[]
) {
  return ownerAgreementSignature(previous) !== ownerAgreementSignature(next);
}

async function getRequiredResponsibility(
  deps: ResponsibilityServiceDeps,
  householdId: HouseholdId,
  responsibilityId: ResponsibilityId
) {
  const responsibility = await deps.getResponsibility({
    householdId,
    responsibilityId
  });

  if (!responsibility) {
    throw new ResponsibilityServiceError(
      "NOT_FOUND",
      "Responsibility not found for this household."
    );
  }

  return responsibility;
}

async function assignmentsWithPersonaIds(
  deps: ResponsibilityServiceDeps,
  householdId: HouseholdId,
  assignments: readonly ResponsibilityAssignmentSummary[]
): Promise<AssignmentReplacement[]> {
  const personas = await deps.listPersonasForHousehold(householdId);

  return assignments.map((assignment) => {
    const persona = personas.find((candidate) => candidate.key === assignment.personaKey);
    if (!persona) {
      throw new ResponsibilityServiceError(
        "INVALID_INPUT",
        "Assignment persona is not available for this household."
      );
    }

    return {
      ...assignment,
      personaId: persona.id
    };
  });
}

function publicCreateInput(input: ResponsibilityCreate): CreateResponsibilityRecordInput {
  const visibility = input.visibility ?? "shared_household";
  assertSharedResponsibilityVisibility(visibility);

  const hasAssignments = Boolean(input.currentAssignments?.length);

  return {
    ...input,
    householdId: "" as HouseholdId,
    createdByPersonaId: "" as PersonaId,
    status: input.status ?? (hasAssignments ? "active" : "unassigned"),
    visibility
  };
}

export function createResponsibilityService(deps: ResponsibilityServiceDeps) {
  return {
    async listOverview(
      session: CurrentSession,
      options: { asOf?: string | Date } = {}
    ): Promise<{
      responsibilities: ResponsibilitySummary[];
      loadSnapshot: LoadSnapshotSummary;
    }> {
      const actorPersonaId = requireSelectedPersona(session);
      await deps.ensureCatalogResponsibilities?.({
        actorPersonaId,
        householdId: session.householdId
      });
      const responsibilities = await deps.listResponsibilities(session.householdId);

      return {
        responsibilities,
        loadSnapshot: buildLoadSnapshot({
          responsibilities,
          asOf: options.asOf
        })
      };
    },

    async get(
      session: CurrentSession,
      responsibilityId: ResponsibilityId
    ): Promise<ResponsibilityDetail> {
      return getRequiredResponsibility(deps, session.householdId, responsibilityId);
    },

    async create(
      session: CurrentSession,
      input: ResponsibilityCreate
    ): Promise<ResponsibilityDetail> {
      const createdByPersonaId = requireSelectedPersona(session);
      const normalized = publicCreateInput(input);
      let responsibility = await deps.createResponsibilityRecord({
        ...normalized,
        householdId: session.householdId,
        createdByPersonaId
      });

      if (input.currentAssignments?.length) {
        responsibility = await this.updateAssignments(session, responsibility.id, {
          effectiveAt: new Date().toISOString(),
          assignments: input.currentAssignments
        });
      }

      return responsibility;
    },

    async update(
      session: CurrentSession,
      responsibilityId: ResponsibilityId,
      input: Partial<Omit<ResponsibilityUpdate, "id">>
    ): Promise<ResponsibilityDetail> {
      await getRequiredResponsibility(deps, session.householdId, responsibilityId);

      return deps.updateResponsibilityRecord({
        ...input,
        householdId: session.householdId,
        responsibilityId
      });
    },

    async updateVisibility(
      session: CurrentSession,
      responsibilityId: ResponsibilityId,
      input: ResponsibilityVisibilityMutation
    ): Promise<ResponsibilityDetail> {
      const actorPersonaId = requireSelectedPersona(session);
      const responsibility = await getRequiredResponsibility(
        deps,
        session.householdId,
        responsibilityId
      );

      if (input.responsibilityId !== responsibilityId) {
        throw new ResponsibilityServiceError(
          "INVALID_INPUT",
          "Visibility update does not match this responsibility."
        );
      }

      if (input.fromVisibility !== responsibility.visibility) {
        throw new ResponsibilityServiceError(
          "INVALID_INPUT",
          "Visibility update is based on stale responsibility data."
        );
      }

      if (input.toVisibility === "private") {
        throw new ResponsibilityServiceError(
          "INVALID_INPUT",
          "Private responsibility visibility is not available in v1."
        );
      }

      try {
        assertVisibilityTransition({
          from: input.fromVisibility,
          to: input.toVisibility,
          confirmed: input.confirmedVisibilityChange
        });
      } catch (error) {
        throw new ResponsibilityServiceError(
          "INVALID_INPUT",
          error instanceof Error
            ? error.message
            : "Visibility update needs confirmation."
        );
      }

      const updated = await deps.updateResponsibilityRecord({
        householdId: session.householdId,
        responsibilityId,
        visibility: input.toVisibility
      });

      await deps.createResponsibilityEvent({
        householdId: session.householdId,
        responsibilityId,
        actorPersonaId,
        eventType: "visibility_changed",
        occurredAt: new Date().toISOString(),
        payload: {
          fromVisibility: input.fromVisibility,
          toVisibility: input.toVisibility,
          confirmationText: input.confirmationText ?? null
        }
      });

      return updated;
    },

    async updateAssignments(
      session: CurrentSession,
      responsibilityId: ResponsibilityId,
      input: AssignmentMutationInput
    ): Promise<ResponsibilityDetail> {
      const actorPersonaId = requireSelectedPersona(session);
      const responsibility = await getRequiredResponsibility(
        deps,
        session.householdId,
        responsibilityId
      );

      const currentOwnerKeys = currentOwnerPersonaKeys(
        responsibility.currentAssignments
      );
      if (
        currentOwnerKeys.length > 0 &&
        ownerAgreementChanged(responsibility.currentAssignments, input.assignments)
      ) {
        throw new ResponsibilityServiceError(
          "INVALID_INPUT",
          "Owner changes must use the ownership agreement endpoint."
        );
      }

      const requestedOwnerKeys = currentOwnerPersonaKeys(input.assignments);
      if (currentOwnerKeys.length === 0 && requestedOwnerKeys.length > 0) {
        const agreement = OwnershipAgreementMutationSchema.safeParse({
          responsibilityId,
          expectedUpdatedAt: responsibility.updatedAt,
          expectedOwnerPersonaKeys: [],
          assignments: input.assignments,
          reviewAt: input.revisitAt ?? null,
          handoffMode: null,
          handoffNotes: input.handoffNotes ?? null
        });

        if (!agreement.success) {
          throw new ResponsibilityServiceError(
            "INVALID_INPUT",
            "Initial ownership agreement input is invalid."
          );
        }

        return deps.applyOwnershipAgreement({
          householdId: session.householdId,
          responsibilityId,
          actorPersonaId,
          expectedUpdatedAt: agreement.data.expectedUpdatedAt,
          expectedOwnerPersonaKeys: agreement.data.expectedOwnerPersonaKeys,
          assignments: agreement.data.assignments,
          reviewAt: agreement.data.reviewAt,
          handoffMode: agreement.data.handoffMode,
          handoffNotes: agreement.data.handoffNotes
        });
      }

      const assignments = await assignmentsWithPersonaIds(
        deps,
        session.householdId,
        input.assignments
      );
      const updated = await deps.replaceActiveAssignments({
        householdId: session.householdId,
        responsibilityId,
        createdByPersonaId: actorPersonaId,
        effectiveAt: input.effectiveAt,
        expectedUpdatedAt: responsibility.updatedAt,
        expectedOwnerPersonaKeys: currentOwnerKeys,
        assignments,
        handoffNotes: input.handoffNotes ?? null,
        revisitAt: input.revisitAt ?? null
      });

      return updated;
    },

    async updateOwnershipAgreement(
      session: CurrentSession,
      responsibilityId: ResponsibilityId,
      input: OwnershipAgreementMutation
    ): Promise<ResponsibilityDetail> {
      const actorPersonaId = requireSelectedPersona(session);
      const agreement = OwnershipAgreementMutationSchema.safeParse(input);

      if (!agreement.success) {
        throw new ResponsibilityServiceError(
          "INVALID_INPUT",
          "Ownership agreement input is invalid."
        );
      }

      if (agreement.data.responsibilityId !== responsibilityId) {
        throw new ResponsibilityServiceError(
          "INVALID_INPUT",
          "Ownership agreement does not match this responsibility."
        );
      }

      return deps.applyOwnershipAgreement({
        householdId: session.householdId,
        responsibilityId,
        actorPersonaId,
        expectedUpdatedAt: agreement.data.expectedUpdatedAt,
        expectedOwnerPersonaKeys: agreement.data.expectedOwnerPersonaKeys,
        assignments: agreement.data.assignments,
        reviewAt: agreement.data.reviewAt,
        handoffMode: agreement.data.handoffMode,
        handoffNotes: agreement.data.handoffNotes
      });
    },

    async updateStatus(
      session: CurrentSession,
      responsibilityId: ResponsibilityId,
      input: StatusMutationInput
    ): Promise<ResponsibilityDetail> {
      const actorPersonaId = requireSelectedPersona(session);
      await getRequiredResponsibility(deps, session.householdId, responsibilityId);

      if (input.status === "archived" && !input.confirmedArchive) {
        throw new ResponsibilityServiceError(
          "INVALID_INPUT",
          "Archive needs explicit confirmation."
        );
      }

      const archivedAt =
        input.status === "archived" ? new Date().toISOString() : undefined;
      const updated = await deps.updateResponsibilityRecord({
        householdId: session.householdId,
        responsibilityId,
        status: input.status,
        nextReviewAt: input.reviewOn ?? undefined,
        ...(archivedAt ? { archivedAt } : {})
      });

      await deps.createResponsibilityEvent({
        householdId: session.householdId,
        responsibilityId,
        actorPersonaId,
        eventType: "status_changed",
        occurredAt: new Date().toISOString(),
        payload: {
          status: input.status,
          note: input.note ?? null,
          reviewOn: input.reviewOn ?? null
        }
      });

      return updated;
    }
  };
}

export const responsibilityService = createResponsibilityService({
  listPersonasForHousehold,
  async createResponsibilityRecord(input) {
    return createResponsibility({
      householdId: input.householdId,
      createdByPersonaId: input.createdByPersonaId,
      title: input.title,
      summary: input.summary ?? null,
      areaKeys: input.areaKeys,
      hiddenEffortKeys: input.hiddenEffortKeys,
      cadence: input.cadence,
      relevantDays: input.relevantDays ?? null,
      status: input.status,
      visibility: input.visibility,
      householdStandard: input.householdStandard ?? null,
      notes: input.notes ?? null,
      nextReviewAt: input.nextReviewAt ?? null
    });
  },
  async updateResponsibilityRecord(input) {
    const updated = await prisma.responsibility.update({
      where: {
        id: input.responsibilityId,
        householdId: input.householdId
      },
      data: {
        title: input.title,
        summary: input.summary,
        areaKeys: input.areaKeys,
        hiddenEffortKeys: input.hiddenEffortKeys,
        cadence: input.cadence,
        relevantDays: input.relevantDays ?? undefined,
        status: input.status,
        visibility: input.visibility,
        householdStandard: input.householdStandard,
        notes: input.notes,
        nextReviewAt:
          input.nextReviewAt === undefined || input.nextReviewAt === null
            ? input.nextReviewAt
            : new Date(input.nextReviewAt),
        archivedAt:
          "archivedAt" in input && typeof input.archivedAt === "string"
            ? new Date(input.archivedAt)
            : undefined
      }
    });

    return getResponsibilityDetail({
      householdId: updated.householdId,
      responsibilityId: updated.id
    }) as Promise<ResponsibilityDetail>;
  },
  getResponsibility: getResponsibilityDetail,
  listResponsibilities: listResponsibilitiesForHousehold,
  ensureCatalogResponsibilities: ensureHouseholdCatalogResponsibilities,
  applyOwnershipAgreement: applyResponsibilityOwnershipAgreement,
  async replaceActiveAssignments(input) {
    return applyResponsibilityAssignmentRevision({
      householdId: input.householdId,
      responsibilityId: input.responsibilityId,
      actorPersonaId: input.createdByPersonaId,
      effectiveAt: input.effectiveAt,
      expectedUpdatedAt: input.expectedUpdatedAt,
      expectedOwnerPersonaKeys: input.expectedOwnerPersonaKeys,
      assignments: input.assignments.map((assignment) => ({
        personaId: assignment.personaId,
        personaKey: assignment.personaKey,
        role: assignment.role,
        scope: assignment.scope
      })),
      handoffNotes: input.handoffNotes,
      revisitAt: input.revisitAt
    });
  },
  async createResponsibilityEvent(input) {
    await prisma.responsibilityEvent.create({
      data: {
        householdId: input.householdId,
        responsibilityId: input.responsibilityId,
        actorPersonaId: input.actorPersonaId,
        eventType: input.eventType,
        payload: input.payload,
        occurredAt: new Date(input.occurredAt)
      }
    });
  },
});
